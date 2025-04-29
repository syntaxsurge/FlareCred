CREATE TABLE "skill_quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_quiz_questions" ADD CONSTRAINT "skill_quiz_questions_quiz_id_skill_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."skill_quizzes"("id") ON DELETE cascade ON UPDATE no action;