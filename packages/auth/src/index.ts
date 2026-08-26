import { createDb } from "@sycom-learn/db";
import * as schema from "@sycom-learn/db/schema";
import { env } from "@sycom-learn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { adminPlugin, customSyntheticUser } from "./configs/admin";
import { sendResetPasswordEmail, sendVerificationEmail } from "./configs/email";
import { haveIBeenPwnedPlugin } from "./configs/have-i-been-pwned";
import { lastLoginMethodPlugin } from "./configs/last-login-method";
import { logger } from "./configs/logger";
import { organizationPlugin } from "./configs/organization";
import { passkeyPlugin } from "./configs/passkey";
import { createProfile } from "./configs/profile";
import { twoFactorPlugin } from "./configs/two-factor";
import { activityLog } from "./plugins/activity-log";

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
      requireEmailVerification: true,
      customSyntheticUser,
      sendResetPassword: ({ user, url }) => sendResetPasswordEmail(user, url),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) => sendVerificationEmail(user, url),
    },
    advanced: {
      cookiePrefix: "sycom",
    },
    databaseHooks: {
      user: {
        create: {
          after: (user) => createProfile(db, user),
        },
      },
    },
    plugins: [
      adminPlugin,
      organizationPlugin,
      twoFactorPlugin,
      passkeyPlugin,
      haveIBeenPwnedPlugin,
      lastLoginMethodPlugin,
      activityLog({ db }),
      tanstackStartCookies(),
    ],
    ...logger,
  });
}

export const auth = createAuth();
