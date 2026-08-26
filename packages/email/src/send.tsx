import { renderEmail } from "@opencoredev/email-sdk/react";
import { env } from "@sycom-learn/env/server";
import { createLoggerWithContext } from "@sycom-learn/logger";
import type { ReactElement } from "react";

import { getEmailClient } from "./client";
import { OrganizationInviteEmail } from "./templates/organization-invite";
import { ResetPasswordEmail } from "./templates/reset-password";
import { VerifyEmail } from "./templates/verify-email";

const log = createLoggerWithContext("email");

type AuthEmailUser = {
  email: string;
  name?: string | null;
};

/**
 * Every send goes through here so the logging is uniform.
 *
 * Note what is *not* logged: the action link. `@sycom-learn/logger` redacts the
 * `url` key precisely so request logging cannot leak query strings, and these
 * links carry single-use tokens.
 */
async function send({
  to,
  subject,
  template,
  meta,
}: {
  to: string;
  subject: string;
  template: ReactElement;
  meta?: Record<string, unknown>;
}) {
  const content = await renderEmail(template);

  try {
    const result = await getEmailClient().send({ from: env.EMAIL_FROM, to, subject, ...content });
    log.info("sent", { to, subject, adapter: result.adapter, id: result.id, ...meta });
    return result;
  } catch (error) {
    log.error("send failed", { to, subject, err: error, ...meta });
    throw error;
  }
}

export async function sendResetPasswordEmail(user: AuthEmailUser, url: string) {
  await send({
    to: user.email,
    subject: "Reset your Sycom Academy password",
    template: <ResetPasswordEmail name={user.name} url={url} />,
  });
}

export async function sendVerificationEmail(user: AuthEmailUser, url: string) {
  await send({
    to: user.email,
    subject: "Verify your email for Sycom Academy",
    template: <VerifyEmail name={user.name} url={url} />,
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
  await send({
    to,
    subject: `Invitation to join ${organizationName} on Sycom Academy`,
    template: (
      <OrganizationInviteEmail
        organizationName={organizationName}
        role={role}
        inviteUrl={inviteUrl}
      />
    ),
    meta: { organizationName, role },
  });
}
