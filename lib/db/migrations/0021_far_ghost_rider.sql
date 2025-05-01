ALTER TABLE "candidates" ADD COLUMN "summary_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "summary_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "summary_daily_count" integer DEFAULT 0 NOT NULL;