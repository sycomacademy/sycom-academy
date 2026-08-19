import pino from "pino";

const isPretty =
  process.env.LOG_PRETTY === "true" ||
  (process.env.LOG_PRETTY !== "false" && process.env.NODE_ENV !== "production");

const transport = isPretty
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        messageFormat: "{msg}",
        hideObject: false,
        singleLine: false,
        useLevelLabels: true,
        levelFirst: true,
        sync: false,
      },
    })
  : undefined;

const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: [
        "url",
        "req.url",
        "req.headers.cookie",
        "req.headers.authorization",
        "*.token",
        "*.password",
        "*.revokedSessionToken",
        "revokedSessionToken",
        "revokedSessionTokenHash",
      ],
      censor: "[REDACTED]",
    },
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  },
  transport,
);

type Level = "info" | "error" | "warn" | "debug";

type LoggerAdapter = Record<Level, (message: string, data?: object) => void>;

function formatContext(ctx?: string): string {
  if (!ctx) return "";
  if (ctx.startsWith("[") && ctx.endsWith("]")) return ctx;
  return `[${ctx}]`;
}

function createLoggerAdapter(pinoLogger: pino.Logger, prefixContext?: string): LoggerAdapter {
  const prefix = formatContext(prefixContext);

  const log = (level: Level, message: string, data?: object) => {
    try {
      const fullMessage = prefix ? `${prefix} ${message}` : message;
      if (data) {
        pinoLogger[level](data, fullMessage);
      } else {
        pinoLogger[level](fullMessage);
      }
    } catch {
      // Silently ignore stream errors (e.g. pino-pretty transport closing)
    }
  };

  return {
    info: (message, data) => log("info", message, data),
    error: (message, data) => log("error", message, data),
    warn: (message, data) => log("warn", message, data),
    debug: (message, data) => log("debug", message, data),
  };
}

export const logger = createLoggerAdapter(baseLogger);

export function createLoggerWithContext(context: string) {
  const childLogger = baseLogger.child({ context });
  return createLoggerAdapter(childLogger, context);
}

export function setLogLevel(level: string) {
  baseLogger.level = level;
}

export default logger;
