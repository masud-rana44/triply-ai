import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import { syncUser, deleteUser } from "@/inngest/functions/sync-user";

const handler = serve({
  client: inngest,
  functions: [syncUser, deleteUser],
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;

