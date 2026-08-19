import { createLoggerWithContext } from "@sycom-learn/logger";

import { t } from "../t";

const trpcLogger = createLoggerWithContext("trpc");

export const loggingMiddleware = t.middleware(async ({ next, path, type, ctx }) => {
  const start = performance.now();
  const userId = ctx.session?.user?.id;

  const result = await next();

  trpcLogger.debug(`${type} ${path}`, {
    path,
    type,
    userId,
    ok: result.ok,
    durationMs: Math.round(performance.now() - start),
  });

  return result;
});
