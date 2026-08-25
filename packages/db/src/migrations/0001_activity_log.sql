CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"actor_email" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_actorId_idx" ON "activity" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_createdAt_idx" ON "activity" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_event_idx" ON "activity" USING btree ("event");