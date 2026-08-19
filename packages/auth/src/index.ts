import { createDb } from "@sycom-learn/db";
import * as schema from "@sycom-learn/db/schema/auth";
import { env } from "@sycom-learn/env/server";
import { createLoggerWithContext } from "@sycom-learn/logger";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

const authLogger = createLoggerWithContext("auth");

export function createAuth() {
  const db = createDb();

  return betterAuth({
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
    plugins: [tanstackStartCookies()],
    logger: {
      level: env.DEBUG_PERFORMANCE ? "debug" : "info",
      log: (level, message, ...args) => {
        const logMessage = `[better-auth:${level}] ${message}`;
        const logData = args.length > 0 ? { args } : undefined;

        if (level === "debug") {
          authLogger.debug(logMessage, logData);
          return;
        }
        if (level === "info") {
          authLogger.info(logMessage, logData);
          return;
        }
        if (level === "warn") {
          authLogger.warn(logMessage, logData);
          return;
        }
        authLogger.error(logMessage, logData);
      },
    },
  });
}

export const auth = createAuth();
