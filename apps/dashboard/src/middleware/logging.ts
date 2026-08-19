import { createLoggerWithContext } from "@sycom-learn/logger";
import { createMiddleware } from "@tanstack/react-start";

const startRequestLogger = createLoggerWithContext("start");
const startFnLogger = createLoggerWithContext("start:fn");

export const requestLoggingMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, next, pathname }) => {
    const start = process.hrtime.bigint();
    const method = request.method;
    const result = await next();
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const status = result.response.status;
    const line = `${method} ${pathname} ${status} - completed in ${durationMs.toFixed(2)}ms`;
    if (result.response.ok || (status >= 300 && status < 400)) {
      startRequestLogger.info(line);
    } else {
      startRequestLogger.error(line);
    }
    return result;
  },
);

export const functionLoggingMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, serverFnMeta }) => {
    const start = process.hrtime.bigint();
    const name = serverFnMeta.name ?? serverFnMeta.id;
    try {
      const result = await next();
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      startFnLogger.info(`${name} ok - completed in ${durationMs.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      startFnLogger.error(`${name} err - completed in ${durationMs.toFixed(2)}ms`, {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);
