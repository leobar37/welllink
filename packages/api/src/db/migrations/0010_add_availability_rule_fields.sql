-- Migration: Add availability rule fields
-- Date: 2024-01-24
-- Purpose: Add missing fields to availability_rule table for scheduling functionality

-- Add new columns to availability_rule table
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "slot_duration" integer NOT NULL DEFAULT 30;
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "buffer_time" integer NOT NULL DEFAULT 0;
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "max_appointments_per_slot" integer NOT NULL DEFAULT 1;
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone NOT NULL DEFAULT NOW();
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;
ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT NOW();

-- Rename the is_available column to is_active if it exists with old name
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_rule' 
        AND column_name = 'is_available'
    ) THEN
        ALTER TABLE "availability_rule" RENAME COLUMN "is_available" TO "is_active";
    END IF;
END $$;

-- Create indexes for new fields (if they don't exist)
CREATE INDEX IF NOT EXISTS "idx_availability_slot_duration" ON "availability_rule" USING btree ("slot_duration");
CREATE INDEX IF NOT EXISTS "idx_availability_effective_from" ON "availability_rule" USING btree ("effective_from");
CREATE INDEX IF NOT EXISTS "idx_availability_effective_to" ON "availability_rule" USING btree ("effective_to");

-- Add comment to explain the table purpose
COMMENT ON TABLE "availability_rule" IS 'Defines availability schedules for professionals with time ranges and slot configuration';
COMMENT ON COLUMN "availability_rule"."slot_duration" IS 'Duration of each appointment slot in minutes';
COMMENT ON COLUMN "availability_rule"."buffer_time" IS 'Buffer time between appointments in minutes';
COMMENT ON COLUMN "availability_rule"."max_appointments_per_slot" IS 'Maximum appointments that can be booked in the same time slot';
COMMENT ON COLUMN "availability_rule"."effective_from" IS 'Start date when this rule becomes effective';
COMMENT ON COLUMN "availability_rule"."effective_to" IS 'End date when this rule expires (null means indefinite)';
