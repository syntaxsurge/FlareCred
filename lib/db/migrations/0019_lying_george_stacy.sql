CREATE TABLE "plan_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_key" varchar(50) NOT NULL,
	"feature" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "plan_features_plan_sort_idx" ON "plan_features" USING btree ("plan_key","sort_order");