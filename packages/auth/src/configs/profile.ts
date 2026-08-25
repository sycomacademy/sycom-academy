import type { Database } from "@sycom-learn/db";
import { profile } from "@sycom-learn/db/schema/profile";
import { createLoggerWithContext } from "@sycom-learn/logger";

const log = createLoggerWithContext("auth:profile");

function splitName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: null, lastName: null };
  }

  const space = trimmed.indexOf(" ");
  if (space === -1) {
    return { firstName: trimmed, lastName: null };
  }

  const lastName = trimmed.slice(space + 1).trim();
  return {
    firstName: trimmed.slice(0, space),
    lastName: lastName || null,
  };
}

export async function createProfile(
  db: Database,
  user: { id: string; name: string },
) {
  try {
    await db.insert(profile).values({
      userId: user.id,
      ...splitName(user.name),
    });
  } catch (error) {
    log.error("Failed to create profile row", { userId: user.id, error });
  }
}
