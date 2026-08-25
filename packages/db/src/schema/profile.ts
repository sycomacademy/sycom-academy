import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "../helpers";
import { user } from "./auth";

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
    timezone: text("timezone"),
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
