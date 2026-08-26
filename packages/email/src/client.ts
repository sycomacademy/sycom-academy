import { env } from "@sycom-learn/env/server";
import { createEmailClient } from "@opencoredev/email-sdk";

import { azureCommunication } from "./adapters/azure-communication";

type Client = ReturnType<typeof create>;

function create() {
  return createEmailClient({
    adapters: [
      azureCommunication({
        endpoint: env.AZURE_COMMUNICATION_ENDPOINT,
        accessKey: env.AZURE_COMMUNICATION_ACCESS_KEY,
      }),
    ],
    defaultAdapter: "azure-communication",
    // The SDK phones home with anonymous usage analytics by default.
    telemetry: false,
  });
}

let client: Client | undefined;

/**
 * Lazy so that importing this package never touches env at module scope: the
 * dashboard build evaluates the auth config with SKIP_ENV_VALIDATION set.
 */
export function getEmailClient(): Client {
  client ??= create();
  return client;
}
