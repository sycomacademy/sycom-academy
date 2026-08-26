import { Button, Text } from "@react-email/components";

import { EmailLayout, button, fallbackLink, text } from "./_layout";

export type VerifyEmailProps = {
  name?: string | null;
  url: string;
};

export function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Confirm your email address to finish setting up your account"
      heading="Verify your email"
      footer="If you did not create a Sycom Academy account you can safely ignore this email."
    >
      <Text style={text}>{name ? `Hi ${name},` : "Hi,"}</Text>
      <Text style={text}>
        Confirm this address to finish setting up your Sycom Academy account.
      </Text>
      <Button href={url} style={button}>
        Verify email
      </Button>
      <Text style={fallbackLink}>Or paste this link into your browser: {url}</Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: "Ada",
  url: "https://academy.sycom.dev/api/auth/verify-email?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
