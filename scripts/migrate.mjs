// Applies Drizzle migrations from inside the Container Apps job.
//
// Uses drizzle-orm's migrator directly rather than the drizzle-kit CLI: drizzle-orm
// and pg are runtime dependencies, so they are guaranteed present in the deployed
// image, whereas drizzle-kit is a devDependency whose bin path depends on how the
// package manager hoisted it.
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "db", "src", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("migrate: DATABASE_URL is not set");
  process.exit(1);
}

const files = await readdir(migrationsFolder).catch(() => {
  console.error(`migrate: no migrations directory at ${migrationsFolder}`);
  process.exit(1);
});

console.log(`migrate: applying from ${migrationsFolder}`);
console.log(`migrate: ${files.filter((f) => f.endsWith(".sql")).length} migration file(s) present`);

const db = drizzle(process.env.DATABASE_URL);

try {
  await migrate(db, { migrationsFolder });
  console.log("migrate: up to date");
} catch (error) {
  console.error("migrate: failed");
  console.error(error);
  process.exit(1);
}

process.exit(0);
