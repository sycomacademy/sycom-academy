import { twoFactor } from "better-auth/plugins/two-factor";

export const twoFactorPlugin = twoFactor({
  issuer: "Sycom Academy",
  allowPasswordless: true,
});
