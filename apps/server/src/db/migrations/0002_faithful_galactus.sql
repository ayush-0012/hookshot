ALTER TABLE "api_keys" RENAME COLUMN "encrypted_api_key" TO "hashed_api_key";--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "failure_category" varchar(50);--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;