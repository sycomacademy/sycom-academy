import {
  EmailAdapterError,
  EmailValidationError,
  type EmailAddress,
  type EmailAdapter,
  type EmailAttachment,
  type EmailMessage,
  type OneOrMany,
} from "@opencoredev/email-sdk";

import { signRequest, toOperationId } from "./sign";

const ADAPTER = "azure-communication";
const API_VERSION = "2025-09-01";

export type AzureCommunicationOptions = {
  /** Resource endpoint, e.g. https://sycomacademy-acs.uk.communication.azure.com */
  endpoint: string;
  /** Base64 access key, from `listKeys().primaryKey` on the resource. */
  accessKey: string;
  fetch?: typeof fetch;
};

type AcsAddress = { address: string; displayName?: string };

type AcsSendResponse = { id?: string; status?: string };

/** `Name <a@b.com>` and bare `a@b.com` both appear in EmailAddress strings. */
function toAcsAddress(address: EmailAddress): AcsAddress {
  if (typeof address !== "string") {
    return address.name
      ? { address: address.email, displayName: address.name }
      : { address: address.email };
  }

  const angled = address.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const email = angled?.[2];
  if (!email) return { address: address.trim() };

  const displayName = angled?.[1]?.replace(/^"|"$/g, "");
  return displayName ? { address: email, displayName } : { address: email };
}

function toAcsAddresses(addresses: OneOrMany<EmailAddress> | undefined): AcsAddress[] | undefined {
  if (addresses === undefined) return undefined;
  const list = Array.isArray(addresses) ? addresses : [addresses];
  return list.length > 0 ? list.map((entry) => toAcsAddress(entry as EmailAddress)) : undefined;
}

async function toBase64(
  content: string | Uint8Array | ArrayBuffer | Blob,
  encoding: "raw" | "base64",
): Promise<string> {
  if (typeof content === "string") {
    return encoding === "base64" ? content : Buffer.from(content, "utf8").toString("base64");
  }
  if (content instanceof Blob) {
    return Buffer.from(await content.arrayBuffer()).toString("base64");
  }
  return Buffer.from(content instanceof ArrayBuffer ? new Uint8Array(content) : content).toString(
    "base64",
  );
}

async function toAcsAttachment(attachment: EmailAttachment) {
  if (attachment.content === undefined) {
    // validate() already rejected path-sourced attachments. Repeating it here is
    // what narrows the union for the type checker.
    throw new EmailValidationError(`${ADAPTER} attachments must carry their bytes in \`content\`.`);
  }

  const base64 = await toBase64(attachment.content, attachment.contentEncoding ?? "raw");
  return {
    name: attachment.filename,
    contentType: attachment.contentType ?? "application/octet-stream",
    contentInBase64: base64,
    ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
  };
}

/**
 * Azure Communication Services Email, spoken directly over its REST API.
 *
 * Email SDK ships 22 provider adapters plus SMTP and none of them is ACS, so
 * this implements the v1 adapter contract itself:
 * https://email-sdk.dev/docs/reference/adapter-contract
 *
 * Only this file knows about Azure. Swapping to any built-in adapter is a change
 * to the `adapters` array in `../client.ts` and nothing else.
 */
export function azureCommunication(
  options: AzureCommunicationOptions,
): EmailAdapter<typeof ADAPTER, undefined, AcsSendResponse> {
  const fetcher = options.fetch ?? fetch;
  const url = new URL(`/emails:send?api-version=${API_VERSION}`, options.endpoint);

  return {
    name: ADAPTER,

    capabilities: {
      // ACS `headers` is a JSON object, so a repeated name would overwrite itself.
      repeatedHeaders: false,
      // The `Operation-Id` request header.
      idempotency: "native",
      // ACS Email has no scheduled-send field.
      scheduling: false,
      // No native bulk API; the client fans recipients out sequentially.
      personalized: "expanded",
    },

    // Capability-driven rules (sendAt, repeated headers) are enforced by the
    // client, so this only covers what ACS itself cannot represent.
    validate(message: EmailMessage) {
      if (message.tags?.length) {
        throw new EmailValidationError(`${ADAPTER} does not support tags.`);
      }
      if (message.metadata && Object.keys(message.metadata).length > 0) {
        throw new EmailValidationError(`${ADAPTER} does not support message metadata.`);
      }
      for (const attachment of message.attachments ?? []) {
        if (attachment.path !== undefined) {
          throw new EmailValidationError(
            `${ADAPTER} does not read attachments from disk. Pass the bytes as \`content\` instead.`,
          );
        }
      }
    },

    async send(message, context) {
      const to = toAcsAddresses(message.to) ?? [];
      const headers = message.headers?.length
        ? Object.fromEntries(message.headers.map((header) => [header.name, header.value]))
        : undefined;
      const attachments = message.attachments?.length
        ? await Promise.all(message.attachments.map(toAcsAttachment))
        : undefined;

      const body = JSON.stringify({
        senderAddress: toAcsAddress(message.from).address,
        content: {
          subject: message.subject,
          ...(message.text ? { plainText: message.text } : {}),
          ...(message.html ? { html: message.html } : {}),
        },
        recipients: {
          to,
          ...(toAcsAddresses(message.cc) ? { cc: toAcsAddresses(message.cc) } : {}),
          ...(toAcsAddresses(message.bcc) ? { bcc: toAcsAddresses(message.bcc) } : {}),
        },
        ...(toAcsAddresses(message.replyTo) ? { replyTo: toAcsAddresses(message.replyTo) } : {}),
        ...(headers ? { headers } : {}),
        ...(attachments ? { attachments } : {}),
        userEngagementTrackingDisabled: true,
      });

      let response: Response;
      try {
        response = await fetcher(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...signRequest({ method: "POST", url, body, accessKey: options.accessKey }),
            ...(context.idempotencyKey
              ? { "operation-id": toOperationId(context.idempotencyKey) }
              : {}),
          },
          body,
          signal: context.signal,
        });
      } catch (cause) {
        // The request may have reached ACS before the socket died, so this is
        // never provably `not_sent`.
        throw new EmailAdapterError(`${ADAPTER} request failed before a response arrived.`, {
          adapter: ADAPTER,
          retryable: true,
          delivery: "unknown",
          cause,
        });
      }

      if (!response.ok) {
        // ACS validates and rejects before queueing, so a status response proves
        // nothing was accepted.
        throw new EmailAdapterError(
          `${ADAPTER} failed with HTTP ${response.status}: ${await response.text().catch(() => "")}`.trim(),
          {
            adapter: ADAPTER,
            status: response.status,
            requestId: response.headers.get("x-ms-request-id") ?? undefined,
            retryable: response.status === 429 || response.status >= 500,
            delivery: "not_sent",
          },
        );
      }

      let raw: AcsSendResponse;
      try {
        raw = (await response.json()) as AcsSendResponse;
      } catch (cause) {
        // 202 already means accepted; an unreadable body is not a send failure.
        throw new EmailAdapterError(`${ADAPTER} returned an unreadable ${response.status} body.`, {
          adapter: ADAPTER,
          status: response.status,
          retryable: false,
          delivery: "unknown",
          cause,
        });
      }

      return {
        adapter: ADAPTER,
        id: raw.id,
        accepted: to.map((recipient) => recipient.address),
        rejected: [],
        raw,
      };
    },
  };
}
