import { Button, Text } from "@react-email/components";

import { EmailLayout, button, fallbackLink, text } from "./_layout";

export type OrganizationInviteEmailProps = {
  organizationName: string;
  role: string;
  inviteUrl: string;
};

export function OrganizationInviteEmail({
  organizationName,
  role,
  inviteUrl,
}: OrganizationInviteEmailProps) {
  return (
    <EmailLayout
      preview={`You have been invited to join ${organizationName}`}
      heading={`Join ${organizationName}`}
      footer="If you were not expecting this invitation you can safely ignore this email."
    >
      <Text style={text}>
        You have been invited to join <strong>{organizationName}</strong> on Sycom Academy as{" "}
        <strong>{role}</strong>.
      </Text>
      <Button href={inviteUrl} style={button}>
        Accept invitation
      </Button>
      <Text style={fallbackLink}>Or paste this link into your browser: {inviteUrl}</Text>
    </EmailLayout>
  );
}

OrganizationInviteEmail.PreviewProps = {
  organizationName: "Cohort 24",
  role: "member",
  inviteUrl: "https://academy.sycom.dev/accept-invitation/preview",
} satisfies OrganizationInviteEmailProps;

export default OrganizationInviteEmail;
