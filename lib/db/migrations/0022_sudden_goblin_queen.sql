CREATE TABLE "recruiter_candidate_fits" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"summary_json" text NOT NULL,
	"profile_hash" varchar(64) NOT NULL,
	"pipelines_hash" varchar(64) NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recruiter_candidate_fits" ADD CONSTRAINT "recruiter_candidate_fits_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_candidate_fits" ADD CONSTRAINT "recruiter_candidate_fits_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recruiter_candidate_unique_idx" ON "recruiter_candidate_fits" USING btree ("recruiter_id","candidate_id");