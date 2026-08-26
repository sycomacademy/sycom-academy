/**
 * Postgres objects that Drizzle cannot express.
 *
 * `drizzle-orm` has builders for checks, foreign keys, indexes, policies, roles,
 * sequences, unique constraints and views — but none for triggers or functions.
 * Drizzle-kit therefore never generates, diffs, or drops what is declared here,
 * and `db:generate` reporting "No schema changes" says nothing about it.
 *
 * So this file is the source of truth instead, and `db:migrate` reapplies it on
 * every run. Every `ddl` must stay idempotent for that to be safe: a reset
 * database or a skipped migration self-corrects on the next deploy rather than
 * silently running without its triggers.
 */
export type SqlObject = {
  /** Identifies the object in apply/verify output. */
  name: string;
  /** Idempotent DDL. Re-running it on an up-to-date database must be a no-op. */
  ddl: string;
  /** Must select exactly one row with one boolean column. */
  verify: string;
};

/**
 * Guarantees every user has a profile row.
 *
 * This is a trigger rather than a Better Auth `databaseHooks.user.create.after`
 * because those run through `queueAfterTransactionHook` — they fire once the
 * insert has already committed, so a throw there cannot roll the user back. An
 * after-hook can report a broken invariant; only the trigger can prevent one.
 * It also covers paths that never reach the auth server at all: admin user
 * creation, seed scripts, psql.
 *
 * `first_name` / `last_name` split on the first space, with empties collapsed
 * to NULL.
 */
export const profileTrigger: SqlObject = {
  name: "profile trigger (user_create_profile)",
  ddl: /* sql */ `
CREATE OR REPLACE FUNCTION create_profile_for_user() RETURNS trigger AS $$
DECLARE
	full_name text := btrim(coalesce(NEW.name, ''));
	space_at int := position(' ' in full_name);
	first_name text;
	last_name text;
BEGIN
	IF full_name = '' THEN
		first_name := NULL;
		last_name := NULL;
	ELSIF space_at = 0 THEN
		first_name := full_name;
		last_name := NULL;
	ELSE
		first_name := substring(full_name from 1 for space_at - 1);
		last_name := nullif(btrim(substring(full_name from space_at + 1)), '');
	END IF;

	INSERT INTO "profile" ("id", "user_id", "first_name", "last_name")
	VALUES (gen_random_uuid()::text, NEW."id", first_name, last_name)
	ON CONFLICT ("user_id") DO NOTHING;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "user_create_profile" ON "user";

CREATE TRIGGER "user_create_profile"
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();
`,
  verify: /* sql */ `
SELECT
	EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_profile_for_user')
	AND EXISTS (
		SELECT 1 FROM pg_trigger
		WHERE tgname = 'user_create_profile' AND NOT tgisinternal
	) AS present;
`,
};

export const sqlObjects: SqlObject[] = [profileTrigger];
