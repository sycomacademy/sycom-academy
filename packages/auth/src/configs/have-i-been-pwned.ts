import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";

export const haveIBeenPwnedPlugin = haveIBeenPwned({
  customPasswordCompromisedMessage:
    "This password appears in a known data breach. Choose a different one.",
});
