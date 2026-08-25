import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createdAt } from "../helpers";
import { user } from "./auth";

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt,
  metadata: text("metadata"),
});

export const cohort = pgTable(
  "cohort",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [index("cohort_organizationId_idx").on(table.organizationId)],
);

export const cohortMember = pgTable(
  "cohort_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => cohort.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    index("cohort_member_teamId_idx").on(table.teamId),
    index("cohort_member_userId_idx").on(table.userId),
    unique("cohort_member_teamId_userId_unique").on(table.teamId, table.userId),
  ],
);

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
    role: text("role").default("student").notNull(),
    createdAt,
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
    unique("member_userId_organizationId_unique").on(table.userId, table.organizationId),
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
    role: text("role"),
    teamId: text("team_id").references(() => cohort.id, { onDelete: "set null" }),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt,
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const organizationRelations = relations(organization, ({ many }) => ({
  cohorts: many(cohort),
  members: many(member),
  invitations: many(invitation),
}));

export const cohortRelations = relations(cohort, ({ one, many }) => ({
  organization: one(organization, {
    fields: [cohort.organizationId],
    references: [organization.id],
  }),
  members: many(cohortMember),
  invitations: many(invitation),
}));

export const cohortMemberRelations = relations(cohortMember, ({ one }) => ({
  cohort: one(cohort, {
    fields: [cohortMember.teamId],
    references: [cohort.id],
  }),
  user: one(user, {
    fields: [cohortMember.userId],
    references: [user.id],
  }),
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

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  cohort: one(cohort, {
    fields: [invitation.teamId],
    references: [cohort.id],
  }),
}));

export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Cohort = typeof cohort.$inferSelect;
export type CohortMember = typeof cohortMember.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
