import { inngest, ClerkUserData, ClerkUserDeletedData } from "../client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Direct DB helper to upsert a user from Clerk data.
 * Can be called inside Inngest step or as a direct sync fallback.
 */
export async function upsertUserToDb(data: ClerkUserData) {
  const { id, email_addresses, first_name, last_name, image_url } = data;
  const email = email_addresses?.[0]?.email_address;

  if (!email) {
    console.warn(`User ${id} does not have an email address. Skipping sync.`);
    return { skipped: true, reason: "no_email" };
  }

  await db
    .insert(users)
    .values({
      id,
      email,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        firstName: first_name || null,
        lastName: last_name || null,
        imageUrl: image_url || null,
        updatedAt: new Date(),
      },
    });

  return { success: true, userId: id, email };
}

/**
 * Direct DB helper to delete a user by Clerk ID.
 */
export async function deleteUserFromDb(id: string) {
  await db.delete(users).where(eq(users.id, id));
  return { success: true, userId: id };
}

/**
 * Inngest function handling both user.created and user.updated events.
 */
export const syncUser = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [
      { event: "clerk/user.created" },
      { event: "clerk/user.updated" },
    ],
  },
  async ({ event, step }) => {
    const data = event.data as ClerkUserData;

    const result = await step.run("save-user-to-db", async () => {
      return await upsertUserToDb(data);
    });

    return result;
  }
);

/**
 * Inngest function handling user.deleted events.
 */
export const deleteUser = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event, step }) => {
    const data = event.data as ClerkUserDeletedData;
    const id = data?.id;

    if (!id) {
      console.warn("User deletion event received without user ID. Skipping.");
      return { skipped: true, reason: "no_user_id" };
    }

    const result = await step.run("delete-user-from-db", async () => {
      return await deleteUserFromDb(id);
    });

    return result;
  }
);

