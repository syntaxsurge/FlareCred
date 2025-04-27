ALTER TABLE "users" ADD COLUMN "wallet_address" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address");