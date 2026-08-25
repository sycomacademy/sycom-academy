import { env } from "@sycom-learn/env/server";
import { organization } from "better-auth/plugins/organization";

import { sendInvitationEmail } from "./email";
import { orgAc, orgRoles } from "./permissions";

export const organizationPlugin = organization({
  ac: orgAc,
  roles: orgRoles,
  creatorRole: "owner",
  // Schools are provisioned by us. Everyone else joins by invitation.
  // allowUserToCreateOrganization: (user) => isPlatformAdmin(user),
  teams: {
    enabled: true,
    // A cohort is created deliberately, not as a side effect of creating
    // the school.
    defaultTeam: { enabled: false },
  },
  requireEmailVerificationOnInvitation: true,
  sendInvitationEmail: (data) =>
    sendInvitationEmail({
      to: data.email,
      inviteUrl: `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`,
      organizationName: data.organization.name,
      role: data.role,
    }),
});
