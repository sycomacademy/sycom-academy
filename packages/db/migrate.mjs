// Applies Drizzle migrations from inside the Container Apps job, which is the only
// place with network access to the database now that Postgres has no public
// endpoint.
//
// Uses drizzle-orm's migrator rather than the drizzle-kit CLI because drizzle-orm
// and pg are runtime dependencies and therefore guaranteed present in the deployed
// image, whereas drizzle-kit is a devDependency whose bin path depends on hoisting.
//
// Lives in packages/db rather than the repo root scripts/ directory: bun does not
// hoist these dependencies to the root node_modules, so Node can only resolve them
// from here.
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "src", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("migrate: DATABASE_URL is not set");
  process.exit(1);
}

const entries = await readdir(migrationsFolder).catch(() => {
  console.error(`migrate: no migrations directory at ${migrationsFolder}`);
  process.exit(1);
});

console.log(`migrate: applying from ${migrationsFolder}`);
console.log(`migrate: ${entries.filter((entry) => entry.endsWith(".sql")).length} migration file(s) present`);

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
