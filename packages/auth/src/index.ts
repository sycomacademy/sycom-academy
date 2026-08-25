import { createDb } from "@sycom-learn/db";
import * as schema from "@sycom-learn/db/schema/auth";
import { env } from "@sycom-learn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { logger } from "./config";
import { activityLog } from "./plugins/activity-log";
import { admin } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    appName: "Sycom Academy",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      cookiePrefix: "sycom",
    },
    // activityLog observes, so it goes last: plugin hooks run in array order and
    // it must see the fully settled context (a plugin like twoFactor nulls
    // `newSession` in its own after-hook while a challenge is pending).
    plugins: [tanstackStartCookies(), admin(), activityLog({ db })],
    ...logger,
  });
}

export const auth = createAuth();
