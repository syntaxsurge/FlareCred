DROP TABLE "verified_credentials" CASCADE;--> statement-breakpoint
ALTER TABLE "candidate_credentials" ADD COLUMN "vc_json" text;--> statement-breakpoint
ALTER TABLE "candidate_credentials" DROP COLUMN "vc_issued_id";