CREATE TYPE "public"."issuer_category" AS ENUM('UNIVERSITY', 'EMPLOYER', 'TRAINING_PROVIDER', 'GOVERNMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."issuer_industry" AS ENUM('TECH', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'AUTOMOTIVE', 'AGRICULTURE', 'MANUFACTURING', 'RETAIL', 'GOVERNMENT', 'NONPROFIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."issuer_status" AS ENUM('PENDING', 'ACTIVE', 'REJECTED');--> statement-breakpoint
ALTER TABLE "issuers" DROP CONSTRAINT "issuers_did_unique";--> statement-breakpoint
ALTER TABLE "issuers" DROP CONSTRAINT "issuers_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "issuers" ALTER COLUMN "did" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "issuers" ALTER COLUMN "status" SET DATA TYPE issuer_status;--> statement-breakpoint
ALTER TABLE "issuers" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "issuers" ALTER COLUMN "domain" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issuers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "issuers" ADD COLUMN "category" "issuer_category" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "issuers" ADD COLUMN "industry" "issuer_industry" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "issuers" DROP COLUMN "updated_at";