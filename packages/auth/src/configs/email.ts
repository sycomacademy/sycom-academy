/**
 * Auth emails live in `@sycom-learn/email`, which owns the transport (Azure
 * Communication Services behind Email SDK) and the React Email templates.
 *
 * This file stays as the seam the auth config imports, so swapping providers
 * never reaches into `packages/auth`.
 */
export {
  sendInvitationEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@sycom-learn/email";
export type { SendInvitationEmailInput } from "@sycom-learn/email";
