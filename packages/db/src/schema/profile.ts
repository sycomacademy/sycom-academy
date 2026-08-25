import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "../helpers";
import { user } from "./auth";

/**
 * Everything we want to know about a person that Better Auth does not own.
 *
 * One row per user, created by a `databaseHooks.user.create.after` hook so it
 * exists for both self sign-up and `admin.createUser`. Deliberately not part of
 * the schema handed to the Better Auth adapter: the plugin must never write here.
 *
 * Identity (`name`, `email`, `image`, `emailVerified`) and the platform role stay
 * on `user`. Nothing is duplicated across the two tables.
 */
export const profile = pgTable(
  "profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    /** IANA zone, e.g. `Europe/London`. Used later for cohort schedules. */
    timezone: text("timezone"),
    /** BCP 47 tag, e.g. `en-GB`. */
    locale: text("locale"),
    bio: text("bio"),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("profile_userId_unique").on(table.userId)],
);

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
