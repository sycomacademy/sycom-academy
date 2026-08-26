import { passkey } from "@better-auth/passkey";
import { env } from "@sycom-learn/env/server";
import type { BetterAuthPlugin } from "better-auth";

const origin = new URL(env.BETTER_AUTH_URL);

export const passkeyPlugin: BetterAuthPlugin = passkey({
  rpName: "Sycom Academy",
  rpID: origin.hostname,
  origin: env.BETTER_AUTH_URL,
});
