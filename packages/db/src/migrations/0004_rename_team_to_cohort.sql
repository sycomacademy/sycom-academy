ALTER TABLE "team" RENAME TO "cohort";
--> statement-breakpoint
ALTER TABLE "team_member" RENAME TO "cohort_member";
--> statement-breakpoint
ALTER INDEX "team_organizationId_idx" RENAME TO "cohort_organizationId_idx";
--> statement-breakpoint
ALTER INDEX "teamMember_teamId_idx" RENAME TO "cohort_member_teamId_idx";
--> statement-breakpoint
ALTER INDEX "teamMember_userId_idx" RENAME TO "cohort_member_userId_idx";
--> statement-breakpoint
ALTER TABLE "cohort_member" RENAME CONSTRAINT "teamMember_teamId_userId_unique" TO "cohort_member_teamId_userId_unique";
--> statement-breakpoint
ALTER TABLE "cohort" RENAME CONSTRAINT "team_organization_id_organization_id_fk" TO "cohort_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "cohort_member" RENAME CONSTRAINT "team_member_team_id_team_id_fk" TO "cohort_member_team_id_cohort_id_fk";
--> statement-breakpoint
ALTER TABLE "cohort_member" RENAME CONSTRAINT "team_member_user_id_user_id_fk" TO "cohort_member_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME CONSTRAINT "invitation_team_id_team_id_fk" TO "invitation_team_id_cohort_id_fk";
--> statement-breakpoint
ALTER TABLE "cohort" ALTER COLUMN "updated_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "cohort" ALTER COLUMN "updated_at" DROP NOT NULL;
