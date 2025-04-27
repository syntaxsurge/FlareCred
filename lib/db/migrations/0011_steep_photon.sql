CREATE TABLE "candidate_highlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"credential_id" integer NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_highlights" ADD CONSTRAINT "candidate_highlights_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_highlights" ADD CONSTRAINT "candidate_highlights_credential_id_candidate_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."candidate_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_highlights_candidate_credential_idx" ON "candidate_highlights" USING btree ("candidate_id","credential_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_highlights_candidate_sort_idx" ON "candidate_highlights" USING btree ("candidate_id","sort_order");