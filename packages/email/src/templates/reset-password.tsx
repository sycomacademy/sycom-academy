import { Button, Text } from "@react-email/components";

import { EmailLayout, button, fallbackLink, text } from "./_layout";

export type ResetPasswordEmailProps = {
  name?: string | null;
  url: string;
};

export function ResetPasswordEmail({ name, url }: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview="Reset the password on your Sycom Academy account"
      heading="Reset your password"
      footer="If you did not ask to reset your password, ignore this email and nothing will change."
    >
      <Text style={text}>{name ? `Hi ${name},` : "Hi,"}</Text>
      <Text style={text}>
        Use the button below to choose a new password. The link expires after a short while.
      </Text>
      <Button href={url} style={button}>
        Reset password
      </Button>
      <Text style={fallbackLink}>Or paste this link into your browser: {url}</Text>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  name: "Ada",
  url: "https://academy.sycom.dev/reset-password?token=preview",
} satisfies ResetPasswordEmailProps;

export default ResetPasswordEmail;
