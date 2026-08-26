import { sql } from "drizzle-orm";

import { connect } from "./connect";
import { sqlObjects } from "./objects";

/**
 * Applies every object in `./objects` — run by `db:migrate` after
 * `drizzle-kit migrate`.
 *
 * One transaction for all of them: DDL is transactional in Postgres, so a typo
 * in any `ddl` rolls the whole thing back rather than leaving a trigger dropped
 * and not recreated.
 */
async function main() {
  const db = connect();

  await db.transaction(async (tx) => {
    for (const object of sqlObjects) {
      await tx.execute(sql.raw(object.ddl));
      console.log(`  applied  ${object.name}`);
    }
  });

  console.log(`[db] ${sqlObjects.length} SQL object(s) applied`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("[db] failed to apply SQL objects:", error);
  process.exit(1);
});
