import { createHash, createHmac } from "node:crypto";

/**
 * Access-key auth for the Azure Communication Services data plane.
 *
 * ACS signs the verb, the path-and-query, and three header values joined by
 * semicolons, then sends the HMAC in an `Authorization` header that names the
 * headers it covers. See
 * https://learn.microsoft.com/azure/communication-services/tutorials/hmac-header-tutorial
 *
 * `host` is signed but never set on the request: fetch derives it from the URL
 * authority, and undici refuses to let us override it anyway. Both sides
 * therefore read the same value out of `url`.
 */
export function signRequest({
  method,
  url,
  body,
  accessKey,
  date = new Date().toUTCString(),
}: {
  method: string;
  url: URL;
  body: string;
  accessKey: string;
  date?: string;
}): Record<string, string> {
  const contentHash = createHash("sha256").update(body, "utf8").digest("base64");
  const stringToSign = `${method}\n${url.pathname}${url.search}\n${date};${url.host};${contentHash}`;

  const signature = createHmac("sha256", Buffer.from(accessKey, "base64"))
    .update(stringToSign, "utf8")
    .digest("base64");

  return {
    "x-ms-date": date,
    "x-ms-content-sha256": contentHash,
    authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ACS types `Operation-Id` as a uuid, but the SDK's idempotency key is any
 * string. A key that already looks like a uuid passes through; anything else is
 * hashed into one, so the same key keeps producing the same operation id.
 */
export function toOperationId(idempotencyKey: string): string {
  if (UUID.test(idempotencyKey)) return idempotencyKey;

  const hex = createHash("sha256").update(idempotencyKey, "utf8").digest("hex").slice(0, 32);
  const variant = ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}
