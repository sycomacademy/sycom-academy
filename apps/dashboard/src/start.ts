import { createStart } from "@tanstack/react-start";

import { functionLoggingMiddleware, requestLoggingMiddleware } from "@/middleware/logging";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware],
  functionMiddleware: [functionLoggingMiddleware],
}));
