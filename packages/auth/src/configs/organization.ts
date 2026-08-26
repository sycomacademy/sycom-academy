import { organization } from "better-auth/plugins/organization";

import { orgAc, orgRoles } from "./permissions";

type OrganizationOptions = NonNullable<Parameters<typeof organization>[0]>;

/**
 * Schema + access-control for organization. Invitation mail is a runtime
 * callback — pass it from `createAuth()`, not here, so the Better Auth CLI
 * can import this file without env.
 */
export function createOrganizationPlugin(
  options?: Pick<OrganizationOptions, "sendInvitationEmail">,
) {
  return organization({
    ac: orgAc,
    roles: orgRoles,
    creatorRole: "owner",
    teams: {
      enabled: true,
    },
    schema: {
      team: { modelName: "cohort" },
      teamMember: { modelName: "cohortMember" },
    },
    allowUserToCreateOrganization: (user) => {
      return user.role === "admin";
    },
    requireEmailVerificationOnInvitation: true,
    ...options,
  });
}

export const organizationPlugin = createOrganizationPlugin();
