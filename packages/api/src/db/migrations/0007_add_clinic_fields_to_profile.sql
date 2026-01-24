-- Migration: add_clinic_fields_to_profile
-- Adds clinic/organization fields to profile table

-- Add clinic/organization fields to profile table
ALTER TABLE "profile" ADD COLUMN "is_organization" boolean NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN "clinic_name" varchar(100);
ALTER TABLE "profile" ADD COLUMN "clinic_address" text;
ALTER TABLE "profile" ADD COLUMN "clinic_phone" varchar(20);
ALTER TABLE "profile" ADD COLUMN "clinic_email" varchar(255);
ALTER TABLE "profile" ADD COLUMN "clinic_website" varchar(255);
ALTER TABLE "profile" ADD COLUMN "clinic_ruc" varchar(20);

-- Create index for is_organization queries
CREATE INDEX IF NOT EXISTS "profile_is_organization_idx" ON "profile" ("is_organization");
