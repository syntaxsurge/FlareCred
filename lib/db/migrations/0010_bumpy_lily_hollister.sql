CREATE TYPE "public"."credential_category" AS ENUM('EDUCATION', 'EXPERIENCE', 'PROJECT', 'AWARD', 'CERTIFICATION', 'OTHER');--> statement-breakpoint
ALTER TABLE "candidate_credentials" ADD COLUMN "category" "credential_category" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "twitter_url" varchar(255);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "github_url" varchar(255);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "linkedin_url" varchar(255);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "website_url" varchar(255);