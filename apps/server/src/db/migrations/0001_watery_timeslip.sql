ALTER TABLE "api_keys" ALTER COLUMN "last_used_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "encrypted_api_key" text;--> statement-breakpoint
ALTER TABLE "endpoint" ADD COLUMN "event_types" text[];--> statement-breakpoint
ALTER TABLE "endpoint" ADD COLUMN "encrypted_signing_key" text;--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "hashed_api_key";--> statement-breakpoint
ALTER TABLE "endpoint" DROP COLUMN "event_type";--> statement-breakpoint
ALTER TABLE "endpoint" DROP COLUMN "signing_key";