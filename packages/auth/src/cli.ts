import { betterAuth } from "better-auth";

import { adminPlugin } from "./configs/admin";
import { organizationPlugin } from "./configs/organization";

/**
 * Config the Better Auth CLI reads for `generate`.
 *
 * Kept off `createAuth()` so the CLI does not need a database, env, cookies,
 * or mail — only the plugins that own tables.
 *
 * Output: `packages/db/generated/better-auth.ts`
 */
export const auth = betterAuth({
  secret: "cli-schema-generate-secret-must-be-32-chars",
  baseURL: "http://localhost:3001",
  emailAndPassword: { enabled: true },
  plugins: [adminPlugin, organizationPlugin],
});
