import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "../helpers";
import { user } from "./auth";

/**
 * Organization plugin tables. Field sets mirror Better Auth 1.6.27 exactly —
 * ids and timestamps are written by the plugin, so no `$defaultFn` here, and no
 * column the plugin does not know about (an extra `NOT NULL` would break its
 * inserts).
 *
 * A `team` is a cohort. Better Auth owns the naming, so the tables keep the
 * plugin's names and the product language lives in the UI.
 */

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // The unique constraint already gives us the lookup index for `checkSlug`.
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  // Better Auth serialises the metadata record to a JSON string before it
  // reaches the adapter, so this is text rather than jsonb.
  metadata: text("metadata"),
  createdAt,
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // owner | admin | teacher | student. Plain text because Better Auth
    // comma-joins multiple roles into the one column.
    role: text("role").notNull().default("student"),
    createdAt,
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
    unique("member_userId_organizationId_unique").on(table.userId, table.organizationId),
  ],
);

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  (table) => [index("team_organizationId_idx").on(table.organizationId)],
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    index("teamMember_teamId_idx").on(table.teamId),
    index("teamMember_userId_idx").on(table.userId),
    unique("teamMember_teamId_userId_unique").on(table.teamId, table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    // Nullable to match the plugin's own field definition (`required: false`).
    role: text("role"),
    // Optional cohort the invite lands in once accepted.
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  teams: many(team),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  members: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [invitation.teamId],
    references: [team.id],
  }),
}));

export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Team = typeof team.$inferSelect;
export type TeamMember = typeof teamMember.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
