import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isDev = process.env.NODE_ENV !== "production";

const url = isDev
  ? process.env.DATABASE_URL || "file:./local.db"
  : process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./local.db";

const authToken = isDev ? undefined : process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
