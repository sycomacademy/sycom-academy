import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins/admin";

import { platformAc, platformRoles } from "./permissions";

type CustomSyntheticUser = NonNullable<
  NonNullable<BetterAuthOptions["emailAndPassword"]>["customSyntheticUser"]
>;

export const adminPlugin = admin({
  ac: platformAc,
  roles: platformRoles,
  defaultRole: "user",
});

export const customSyntheticUser: CustomSyntheticUser = ({ coreFields, additionalFields, id }) => ({
  ...coreFields,
  role: "user",
  banned: false,
  banReason: null,
  banExpires: null,
  twoFactorEnabled: false,
  lastLoginMethod: null,
  ...additionalFields,
  id,
});
