--> statement-breakpoint
CREATE TYPE payment_method_type AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
  'insurance',
  'payment_plan'
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_method" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profile"(id) ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "type" payment_method_type NOT NULL,
  "instructions" text,
  "details" jsonb,
  "is_active" boolean NOT NULL DEFAULT false,
  "display_order" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_method_profile_id" ON "payment_method"("profile_id");
CREATE INDEX IF NOT EXISTS "idx_payment_method_type" ON "payment_method"("type");
CREATE INDEX IF NOT EXISTS "idx_payment_method_active" ON "payment_method"("is_active");
