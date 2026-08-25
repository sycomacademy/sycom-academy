import { createLoggerWithContext } from "@sycom-learn/logger";

const log = createLoggerWithContext("auth:email");

type AuthEmailUser = {
  email: string;
  name?: string | null;
};

const sendAuthEmail = async ({
  to,
  subject,
  label,
  link,
  meta,
}: {
  to: string;
  subject: string;
  label: string;
  link: string;
  meta?: Record<string, unknown>;
}) => {
  log.info(`${label} (stub, not sent)`, { to, subject, link, ...meta });
};

export async function sendResetPasswordEmail(user: AuthEmailUser, url: string) {
  await sendAuthEmail({
    to: user.email,
    subject: "Reset your Sycom Academy password",
    label: "password reset",
    link: url,
  });
}

export async function sendVerificationEmail(user: AuthEmailUser, url: string) {
  await sendAuthEmail({
    to: user.email,
    subject: "Verify your email for Sycom Academy",
    label: "email verification",
    link: url,
  });
}

export type SendInvitationEmailInput = {
  to: string;
  inviteUrl: string;
  organizationName: string;
  role: string;
};

export async function sendInvitationEmail({
  to,
  inviteUrl,
  organizationName,
  role,
}: SendInvitationEmailInput) {
  await sendAuthEmail({
    to,
    subject: `Invitation to join ${organizationName} on Sycom Academy`,
    label: "org member invite",
    link: inviteUrl,
    meta: { organizationName, role },
  });
}
