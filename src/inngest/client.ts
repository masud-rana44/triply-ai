import { Inngest } from "inngest";

export type ClerkUserData = {
  id: string;
  email_addresses?: Array<{
    email_address: string;
    id?: string;
  }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  [key: string]: any;
};

export type ClerkUserDeletedData = {
  id?: string;
  deleted?: boolean;
  [key: string]: any;
};

export type Events = {
  "clerk/user.created": {
    data: ClerkUserData;
  };
  "clerk/user.updated": {
    data: ClerkUserData;
  };
  "clerk/user.deleted": {
    data: ClerkUserDeletedData;
  };
};

export const inngest = new Inngest({
  id: "triply",
  isDev: process.env.NODE_ENV !== "production" || process.env.INNGEST_DEV === "1",
});


