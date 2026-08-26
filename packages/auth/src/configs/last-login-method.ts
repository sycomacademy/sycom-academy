import { lastLoginMethod } from "better-auth/plugins";

export const lastLoginMethodPlugin = lastLoginMethod({
  storeInDatabase: true,
  cookieName: "sycom.last_used_login_method",
});
