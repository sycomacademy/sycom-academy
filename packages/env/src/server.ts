import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    AZURE_COMMUNICATION_ENDPOINT: z.url(),
    AZURE_COMMUNICATION_ACCESS_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DEBUG_PERFORMANCE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
