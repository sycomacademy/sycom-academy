import { sql } from "drizzle-orm";

import { connect } from "./connect";
import { sqlObjects } from "./objects";

/**
 * Asserts every object in `./objects` is present.
 *
 * Not part of CI: `.github/workflows/ci.yml` runs without a database on
 * purpose. This is for running by hand, or in a deploy step that has one.
 */
async function main() {
  const db = connect();
  let missing = 0;

  for (const object of sqlObjects) {
    const result = await db.execute(sql.raw(object.verify));
    const present = Object.values(result.rows[0] ?? {})[0] === true;

    console.log(`  ${present ? "ok      " : "MISSING "} ${object.name}`);
    if (!present) missing += 1;
  }

  if (missing > 0) {
    console.error(
      `[db] ${missing} SQL object(s) missing. Run \`bun run db:migrate\` to reapply.`,
    );
    process.exit(1);
  }

  console.log(`[db] all ${sqlObjects.length} SQL object(s) present`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("[db] failed to verify SQL objects:", error);
  process.exit(1);
});
