CREATE TABLE "candidate_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"issuer_id" integer,
	"title" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"file_url" text,
	"status" varchar(20) DEFAULT 'unverified' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"vc_issued_id" text,
	"issued_at" timestamp,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issuers" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"logo_url" text,
	"did" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"domain" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issuers_did_unique" UNIQUE("did")
);
--> statement-breakpoint
CREATE TABLE "pipeline_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipeline_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"stage" varchar(50) DEFAULT 'sourced' NOT NULL,
	"notes" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_credentials" ADD CONSTRAINT "candidate_credentials_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_credentials" ADD CONSTRAINT "candidate_credentials_issuer_id_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_candidates" ADD CONSTRAINT "pipeline_candidates_pipeline_id_recruiter_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."recruiter_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_candidates" ADD CONSTRAINT "pipeline_candidates_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_pipelines" ADD CONSTRAINT "recruiter_pipelines_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;