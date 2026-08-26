import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";

/**
 * A connection for the standalone scripts in this directory.
 *
 * Deliberately not `getDb()` / `createDb()`: those read the validated `env`
 * object, which covers the whole server surface — mail credentials included. A
 * migration step must not fail because email is unconfigured, and a deploy
 * runner may legitimately have nothing but `DATABASE_URL`. So this mirrors
 * `drizzle.config.ts`: same env file, same single variable, read raw.
 */
export function connect() {
  dotenv.config({ path: "../../apps/dashboard/.env" });

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  return drizzle(url);
}
