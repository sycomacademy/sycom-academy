import { orgAc, orgRoles, platformAc, platformRoles } from "@sycom-learn/auth/configs/permissions";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// The same access controllers the server uses, so `checkRolePermission` can
// answer without a round trip.
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
  ],
});
