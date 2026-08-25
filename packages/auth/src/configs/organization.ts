import { organization } from "better-auth/plugins/organization";

import { sendInvitationEmail } from "./email";
import { orgAc, orgRoles } from "./permissions";

export const organizationPlugin = organization({
  ac: orgAc,
  roles: orgRoles,
  creatorRole: "owner",
  teams: {
    enabled: true,
  },
  schema: {
    team: { modelName: "cohort" },
    teamMember: { modelName: "cohort_member" },
  },
  allowUserToCreateOrganization: (user) => {
    return user.role === "admin";
  },
  requireEmailVerificationOnInvitation: true,
  sendInvitationEmail: (data) =>
    sendInvitationEmail({
      to: data.email,
      inviteUrl: `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`,
      organizationName: data.organization.name,
      role: data.role,
    }),
});
