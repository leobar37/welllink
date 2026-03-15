-- Create staff role enum
CREATE TYPE staff_role AS ENUM ('admin', 'manager', 'staff');

-- Create staff table
CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(20),
  "role" staff_role NOT NULL DEFAULT 'staff',
  "avatar_id" uuid,
  "is_active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_staff_profile_id" ON "staff"("profile_id");
CREATE INDEX "idx_staff_user_id" ON "staff"("user_id");
CREATE INDEX "idx_staff_active" ON "staff"("is_active");

-- Create staff_service junction table
CREATE TABLE "staff_service" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staff_id" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "service"("id") ON DELETE CASCADE,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  UNIQUE("staff_id", "service_id")
);

CREATE INDEX "idx_staff_service_staff_id" ON "staff_service"("staff_id");
CREATE INDEX "idx_staff_service_service_id" ON "staff_service"("service_id");

-- Create staff_availability table
CREATE TABLE "staff_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staff_id" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
  "day_of_week" integer NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "breaks" jsonb DEFAULT '[]',
  "is_available" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  UNIQUE("staff_id", "day_of_week")
);

CREATE INDEX "idx_staff_availability_staff_id" ON "staff_availability"("staff_id");
CREATE INDEX "idx_staff_availability_day" ON "staff_availability"("day_of_week");

-- Add foreign key for avatar_id in staff table
ALTER TABLE "staff" ADD CONSTRAINT "staff_avatar_id_fkey" 
  FOREIGN KEY ("avatar_id") REFERENCES "asset"("id") ON DELETE SET NULL;
