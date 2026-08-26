import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc as platformBuiltInAdminAc,
  defaultStatements as platformDefaultStatements,
  userAc as platformBuiltInUserAc,
} from "better-auth/plugins/admin/access";
import {
  adminAc as orgBuiltInAdminAc,
  defaultStatements as orgDefaultStatements,
  memberAc as orgBuiltInMemberAc,
  ownerAc as orgBuiltInOwnerAc,
} from "better-auth/plugins/organization/access";

const platformStatements = {
  ...platformDefaultStatements,
} as const;

export const platformAc = createAccessControl(platformStatements);

export const platformAdminRole = platformAc.newRole({
  ...platformBuiltInAdminAc.statements,
});

export const platformUserRole = platformAc.newRole({
  ...platformBuiltInUserAc.statements,
});

export const platformRoles = {
  admin: platformAdminRole,
  user: platformUserRole,
};

const orgStatements = {
  ...orgDefaultStatements,
} as const;

export const orgAc = createAccessControl(orgStatements);

export const orgOwnerRole = orgAc.newRole({
  ...orgBuiltInOwnerAc.statements,
});

export const orgAdminRole = orgAc.newRole({
  ...orgBuiltInAdminAc.statements,
});

export const orgTeacherRole = orgAc.newRole({
  ...orgBuiltInMemberAc.statements,
  invitation: ["create", "cancel"],
});

export const orgStudentRole = orgAc.newRole({
  ...orgBuiltInMemberAc.statements,
});

export const orgRoles = {
  owner: orgOwnerRole,
  admin: orgAdminRole,
  teacher: orgTeacherRole,
  student: orgStudentRole,
};
