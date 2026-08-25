import { env } from "@sycom-learn/env/server";
import { createLoggerWithContext } from "@sycom-learn/logger";
import type { BetterAuthOptions } from "better-auth";

const authLogger = createLoggerWithContext("auth");

export const logger = {
  logger: {
    level: env.DEBUG_PERFORMANCE ? "debug" : "info",
    log: (level, message, ...args) => {
      const logMessage = `[better-auth:${level}] ${message}`;
      const logData = args.length > 0 ? { args } : undefined;

      if (level === "debug") {
        authLogger.debug(logMessage, logData);
        return;
      }
      if (level === "info") {
        authLogger.info(logMessage, logData);
        return;
      }
      if (level === "warn") {
        authLogger.warn(logMessage, logData);
        return;
      }
      authLogger.error(logMessage, logData);
    },
  },
} satisfies Pick<BetterAuthOptions, "logger">;
