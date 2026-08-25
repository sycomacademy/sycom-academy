import { createDb } from "@sycom-learn/db";
import * as schema from "@sycom-learn/db/schema/auth";
import { env } from "@sycom-learn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { logger } from "./config/logger";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    appName: "Sycom Academy",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      cookiePrefix: "sycom",
    },
    plugins: [tanstackStartCookies()],
    ...logger,
  });
}

export const auth = createAuth();
