ALTER TABLE "candidate_credentials" ADD COLUMN "proof_type" varchar(30) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_credentials" ADD COLUMN "proof_data" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN "seed" varchar(66) DEFAULT '' NOT NULL;