import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, index } from "drizzle-orm/pg-core";

import { createdAt } from "../helpers";
import { user } from "./auth";

export const ACTIVITY_EVENTS = [
  "user.signed_up",
  "user.signed_in",
  "user.sign_in_failed",
  "user.signed_out",
  "user.updated",
  "user.deleted",
  "user.password_changed",
  "user.password_reset_requested",
  "user.password_reset",
  "user.email_change_requested",
  "user.email_verified",
  "session.created",
  "session.revoked",
  "account.linked",
  "account.unlinked",
] as const;

export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];

export const activity = pgTable(
  "activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    event: text("event").$type<ActivityEvent>().notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    sessionId: text("session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt,
  },
  (table) => [
    index("activity_actorId_idx").on(table.actorId),
    index("activity_createdAt_idx").on(table.createdAt.desc()),
    index("activity_event_idx").on(table.event),
  ],
);

export type Activity = typeof activity.$inferSelect;
export type NewActivity = typeof activity.$inferInsert;

export const activityRelations = relations(activity, ({ one }) => ({
  actor: one(user, {
    fields: [activity.actorId],
    references: [user.id],
  }),
}));
