import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is required.");
}

const client = neon(connectionString || "");
export const db = drizzle({ client, schema });
export * from "./schema";
