import { passkeyClient } from "@better-auth/passkey/client";
import { orgAc, orgRoles, platformAc, platformRoles } from "@sycom-learn/auth/configs/permissions";
import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: platformAc,
      roles: platformRoles,
    }),
    organizationClient({
      ac: orgAc,
      roles: orgRoles,
      teams: { enabled: true },
    }),
    twoFactorClient(),
    passkeyClient(),
    lastLoginMethodClient({
      cookieName: "sycom.last_used_login_method",
    }),
  ],
});
