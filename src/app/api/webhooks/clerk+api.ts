import { Webhook } from "svix";
import { inngest } from "@/inngest/client";
import {
  upsertUserToDb,
  deleteUserFromDb,
} from "@/inngest/functions/sync-user";

export async function POST(req: Request) {
  const webhookSecret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "Missing CLERK_WEBHOOK_SIGNING_SECRET or CLERK_WEBHOOK_SECRET in environment variables."
    );
    return Response.json(
      { error: "Webhook secret is not configured" },
      { status: 500 }
    );
  }

  // Get Svix headers for signature verification
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json(
      { error: "Missing Svix signature headers" },
      { status: 400 }
    );
  }

  const payload = await req.text();

  const wh = new Webhook(webhookSecret);

  try {
    wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("Clerk webhook signature verification failed:", err?.message || err);
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // svix verify() validates the cryptographic signature; payload must be parsed from JSON
  let evt: any;
  try {
    evt = JSON.parse(payload);
  } catch (err: any) {
    console.error("Failed to parse Clerk webhook JSON payload:", err?.message || err);
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType: string = evt.type;

  // Dispatch Inngest events for user lifecycle
  try {
    if (eventType === "user.created") {
      await inngest.send({
        name: "clerk/user.created",
        data: evt.data,
      });
    } else if (eventType === "user.updated") {
      await inngest.send({
        name: "clerk/user.updated",
        data: evt.data,
      });
    } else if (eventType === "user.deleted") {
      await inngest.send({
        name: "clerk/user.deleted",
        data: evt.data,
      });
    }
  } catch (inngestErr: any) {
    console.warn(
      `[Inngest] Could not deliver event "${eventType}" to Inngest dev/remote server (${inngestErr?.message || inngestErr}). Falling back to direct database sync.`
    );
    // Direct database sync fallback ensures user data is NEVER lost if Inngest dev server is offline
    if (eventType === "user.created" || eventType === "user.updated") {
      await upsertUserToDb(evt.data);
    } else if (eventType === "user.deleted" && evt.data?.id) {
      await deleteUserFromDb(evt.data.id);
    }
  }

  return Response.json({ received: true, event: eventType });
}

