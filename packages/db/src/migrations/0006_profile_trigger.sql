-- Every user has a profile row, enforced by the database rather than by an
-- application hook.
--
-- Better Auth runs `databaseHooks.user.create.after` through
-- `queueAfterTransactionHook`, which fires only once the insert has already
-- committed. A failure there cannot roll the user back, so the hook could never
-- make this an invariant — it could only report that it had been broken. A
-- trigger runs inside the same statement: if the profile insert fails, the user
-- insert fails with it, and no path can bypass it — not admin/create-user, not
-- a seed script, not psql.
--
-- `first_name` / `last_name` mirror the splitting the TypeScript hook did:
-- everything before the first space, then the remainder trimmed, with empties
-- collapsed to NULL.

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
--> statement-breakpoint

DROP TRIGGER IF EXISTS "user_create_profile" ON "user";--> statement-breakpoint

CREATE TRIGGER "user_create_profile"
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();
--> statement-breakpoint

-- Backfill anyone who signed up while the application hook owned this.
INSERT INTO "profile" ("id", "user_id", "first_name", "last_name")
SELECT
	gen_random_uuid()::text,
	u."id",
	CASE
		WHEN btrim(coalesce(u."name", '')) = '' THEN NULL
		WHEN position(' ' in btrim(u."name")) = 0 THEN btrim(u."name")
		ELSE substring(btrim(u."name") from 1 for position(' ' in btrim(u."name")) - 1)
	END,
	CASE
		WHEN btrim(coalesce(u."name", '')) = '' THEN NULL
		WHEN position(' ' in btrim(u."name")) = 0 THEN NULL
		ELSE nullif(btrim(substring(btrim(u."name") from position(' ' in btrim(u."name")) + 1)), '')
	END
FROM "user" u
ON CONFLICT ("user_id") DO NOTHING;
