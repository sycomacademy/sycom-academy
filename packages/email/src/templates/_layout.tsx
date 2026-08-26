import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const styles = {
  body: {
    backgroundColor: "#f5f5f4",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "40px",
  },
  brand: {
    color: "#0c0a09",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    margin: "0 0 32px",
  },
  heading: {
    color: "#0c0a09",
    fontSize: "24px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "32px",
    margin: "0 0 16px",
  },
  hr: { borderColor: "#e7e5e4", margin: "32px 0 20px" },
  footer: { color: "#78716c", fontSize: "13px", lineHeight: "20px", margin: 0 },
} as const;

export const text = {
  color: "#44403c",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
} as const;

export const button = {
  backgroundColor: "#0c0a09",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 500,
  padding: "12px 24px",
  textDecoration: "none",
} as const;

export const fallbackLink = {
  color: "#78716c",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
  wordBreak: "break-all",
} as const;

/**
 * Shared shell for every Sycom Academy email. Styles are inline objects rather
 * than Tailwind because email clients strip <style> blocks.
 */
export function EmailLayout({
  preview,
  heading,
  children,
  footer,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Sycom Academy</Text>
          <Heading style={styles.heading}>{heading}</Heading>
          <Section>{children}</Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            {footer ?? "If you were not expecting this email you can safely ignore it."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
