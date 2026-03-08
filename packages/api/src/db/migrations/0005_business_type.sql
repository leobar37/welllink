-- Migration: business_type table
-- Created for: m5-1-business-type-schema
-- Adds business_type table and business_type_id to profile

-- Create business_type table
CREATE TABLE IF NOT EXISTS "business_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(50) NOT NULL UNIQUE,
	"description" text,
	"icon" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for business_type
CREATE INDEX IF NOT EXISTS "business_type_key_idx" ON "business_type" ("key");
CREATE INDEX IF NOT EXISTS "business_type_name_idx" ON "business_type" ("name");
CREATE INDEX IF NOT EXISTS "business_type_is_active_idx" ON "business_type" ("is_active");

-- Add business_type_id to profile table
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "business_type_id" uuid REFERENCES "business_type"("id") ON DELETE SET NULL;

-- Create index for profile business_type_id
CREATE INDEX IF NOT EXISTS "profile_business_type_id_idx" ON "profile" ("business_type_id");
