ALTER TABLE "teams" DROP CONSTRAINT "teams_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "subscription_paid_until" timestamp;--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "stripe_product_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "subscription_status";