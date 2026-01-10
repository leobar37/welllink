# Database Schema Changes - Medical Reservation System

## Overview

This migration creates the complete database schema for the medical reservation system, replacing wellness-focused tables with medical-specific ones.

## Schema Changes

### 1. New Medical Tables

#### Service Catalog Table

```sql
CREATE TABLE medical_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- minutes
  price DECIMAL(10, 2),
  category VARCHAR(100), -- 'consulta', 'procedimiento', 'analisis', etc.
  requirements TEXT, -- prerequisites for the service
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_service_profile_id ON medical_service(profile_id);
CREATE INDEX idx_medical_service_category ON medical_service(category);
CREATE INDEX idx_medical_service_active ON medical_service(is_active);
```

#### Availability Rules Table

```sql
CREATE TABLE availability_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL, -- '09:00'
  end_time TIME NOT NULL, -- '17:00'
  slot_duration INTEGER NOT NULL DEFAULT 30, -- minutes per appointment
  buffer_time INTEGER DEFAULT 0, -- minutes between appointments
  max_appointments_per_slot INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE, -- null = indefinite
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_profile_id ON availability_rule(profile_id);
CREATE INDEX idx_availability_day ON availability_rule(day_of_week);
CREATE INDEX idx_availability_active ON availability_rule(is_active);
```

#### Time Slots Table

```sql
CREATE TABLE time_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_reservations INTEGER NOT NULL DEFAULT 1,
  current_reservations INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'pending_approval', 'reserved', 'expired', 'blocked'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- for pending_approval slots

  CONSTRAINT chk_time_slot_status CHECK (status IN ('available', 'pending_approval', 'reserved', 'expired', 'blocked')),
  CONSTRAINT chk_time_slot_logic CHECK (end_time > start_time)
);

CREATE INDEX idx_time_slot_profile_id ON time_slot(profile_id);
CREATE INDEX idx_time_slot_service_id ON time_slot(service_id);
CREATE INDEX idx_time_slot_start_time ON time_slot(start_time);
CREATE INDEX idx_time_slot_status ON time_slot(status);
CREATE INDEX idx_time_slot_expires ON time_slot(expires_at);
```

#### Reservation Request Table

```sql
CREATE TABLE reservation_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES time_slot(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,

  -- Patient Information
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50) NOT NULL,
  patient_email VARCHAR(255),
  patient_age INTEGER,
  patient_gender VARCHAR(20),

  -- Request Details
  chief_complaint TEXT, -- main medical concern
  symptoms TEXT,
  medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  urgency_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'phone', 'email'

  -- Request Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  requested_time TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- usually 30 minutes from creation

  -- Approval Details
  approved_by UUID REFERENCES profile(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_request_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  CONSTRAINT chk_urgency_level CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_request_profile_id ON reservation_request(profile_id);
CREATE INDEX idx_request_slot_id ON reservation_request(slot_id);
CREATE INDEX idx_request_status ON reservation_request(status);
CREATE INDEX idx_request_expires ON reservation_request(expires_at);
CREATE INDEX idx_request_patient_phone ON reservation_request(patient_phone);
```

#### Reservation Confirmation Table

```sql
CREATE TABLE reservation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES time_slot(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
  request_id UUID REFERENCES reservation_request(id) ON DELETE SET NULL,

  -- Patient Information
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50) NOT NULL,
  patient_email VARCHAR(255),

  -- Reservation Details
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed', 'no_show'
  source VARCHAR(50) DEFAULT 'whatsapp', -- 'whatsapp', 'web', 'phone', 'direct'
  notes TEXT, -- doctor's notes about the appointment

  -- Reminder Tracking
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  reminder_24h_scheduled BOOLEAN DEFAULT false,
  reminder_2h_scheduled BOOLEAN DEFAULT false,

  -- Completion Tracking
  completed_at TIMESTAMP,
  no_show BOOLEAN DEFAULT false,

  -- Financial
  price_at_booking DECIMAL(10, 2), -- price when booked
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,

  CONSTRAINT chk_reservation_status CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  CONSTRAINT chk_payment_status CHECK (payment_status IN ('pending', 'paid', 'cancelled'))
);

CREATE INDEX idx_reservation_profile_id ON reservation(profile_id);
CREATE INDEX idx_reservation_slot_id ON reservation(slot_id);
CREATE INDEX idx_reservation_status ON reservation(status);
CREATE INDEX idx_reservation_patient_phone ON reservation(patient_phone);
CREATE INDEX idx_reservation_created ON reservation(created_at);
```

#### Appointment Notes Table

```sql
CREATE TABLE appointment_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservation(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,

  note_type VARCHAR(50) NOT NULL, -- 'diagnosis', 'treatment', 'follow_up', 'prescription'
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- visible only to doctor

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_note_type CHECK (note_type IN ('diagnosis', 'treatment', 'follow_up', 'prescription'))
);

CREATE INDEX idx_note_reservation_id ON appointment_note(reservation_id);
CREATE INDEX idx_note_profile_id ON appointment_note(profile_id);
CREATE INDEX idx_note_type ON appointment_note(note_type);
```

### 2. Migration Strategy

#### Rename Existing Tables

```sql
-- Rename existing wellness tables (preserve data)
ALTER TABLE health_survey RENAME TO patient_assessment;
ALTER TABLE social_click RENAME TO appointment_source_tracking;
```

#### Create Medical-Specific Tables

```sql
-- Create new medical tables
CREATE TABLE medical_service (...);
CREATE TABLE availability_rule (...);
CREATE TABLE time_slot (...);
CREATE TABLE reservation_request (...);
CREATE TABLE reservation (...);
CREATE TABLE appointment_note (...);
```

#### Add Medical Context to Profile

```sql
ALTER TABLE profile ADD COLUMN IF NOT EXISTS
  medical_license VARCHAR(50),
  specialty VARCHAR(100),
  practice_type VARCHAR(50), -- 'general', 'specialist', 'clinic'
  appointment_approval_required BOOLEAN DEFAULT true,
  max_appointment_duration INTEGER DEFAULT 60,
  buffer_time_minutes INTEGER DEFAULT 15,
  cancellation_policy TEXT;
```

### 3. Drizzle Schema Definitions

#### Medical Service Schema

```typescript
// packages/api/src/db/schema/medical-service.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const medicalService = pgTable(
  "medical_service",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    duration: integer("duration").notNull(), // minutes
    price: decimal("price", { precision: 10, scale: 2 }),
    category: varchar("category", { length: 100 }),
    requirements: text("requirements"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_medical_service_profile_id").on(table.profileId),
    categoryIdx: index("idx_medical_service_category").on(table.category),
    activeIdx: index("idx_medical_service_active").on(table.isActive),
  }),
);

export type MedicalService = typeof medicalService.$inferSelect;
export type NewMedicalService = typeof medicalService.$inferInsert;
```

#### Time Slot Schema

```typescript
// packages/api/src/db/schema/time-slot.ts
import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { medicalService } from "./medical-service";

export const slotStatus = [
  "available",
  "pending_approval",
  "reserved",
  "expired",
  "blocked",
] as const;
export type SlotStatus = (typeof slotStatus)[number];

export const timeSlot = pgTable(
  "time_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => medicalService.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    maxReservations: integer("max_reservations").notNull().default(1),
    currentReservations: integer("current_reservations").notNull().default(0),
    status: varchar("status", { length: 50 })
      .$type<SlotStatus>()
      .notNull()
      .default("available"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    profileIdIdx: index("idx_time_slot_profile_id").on(table.profileId),
    serviceIdIdx: index("idx_time_slot_service_id").on(table.serviceId),
    startTimeIdx: index("idx_time_slot_start_time").on(table.startTime),
    statusIdx: index("idx_time_slot_status").on(table.status),
    expiresIdx: index("idx_time_slot_expires").on(table.expiresAt),
  }),
);

export type TimeSlot = typeof timeSlot.$inferSelect;
export type NewTimeSlot = typeof timeSlot.$inferInsert;
```

#### Reservation Request Schema

```typescript
// packages/api/src/db/schema/reservation-request.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { timeSlot } from "./time-slot";
import { medicalService } from "./medical-service";

export const requestStatus = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;
export const urgencyLevel = ["low", "normal", "high", "urgent"] as const;
export const contactMethod = ["whatsapp", "phone", "email"] as const;

export type RequestStatus = (typeof requestStatus)[number];
export type UrgencyLevel = (typeof urgencyLevel)[number];
export type ContactMethod = (typeof contactMethod)[number];

export const reservationRequest = pgTable(
  "reservation_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => timeSlot.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => medicalService.id, { onDelete: "cascade" }),

    // Patient Information
    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }),
    patientAge: integer("patient_age"),
    patientGender: varchar("patient_gender", { length: 20 }),

    // Request Details
    chiefComplaint: text("chief_complaint"),
    symptoms: text("symptoms"),
    medicalHistory: text("medical_history"),
    currentMedications: text("current_medications"),
    allergies: text("allergies"),
    urgencyLevel: varchar("urgency_level", { length: 20 })
      .$type<UrgencyLevel>()
      .default("normal"),
    preferredContactMethod: varchar("preferred_contact_method", { length: 20 })
      .$type<ContactMethod>()
      .default("whatsapp"),

    // Request Status
    status: varchar("status", { length: 50 })
      .$type<RequestStatus>()
      .notNull()
      .default("pending"),
    requestedTime: timestamp("requested_time").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    // Approval Details
    approvedBy: uuid("approved_by").references(() => profile.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_request_profile_id").on(table.profileId),
    slotIdIdx: index("idx_request_slot_id").on(table.slotId),
    statusIdx: index("idx_request_status").on(table.status),
    expiresIdx: index("idx_request_expires").on(table.expiresAt),
    phoneIdx: index("idx_request_patient_phone").on(table.patientPhone),
  }),
);

export type ReservationRequest = typeof reservationRequest.$inferSelect;
export type NewReservationRequest = typeof reservationRequest.$inferInsert;
```

### 4. Migration Scripts

#### Create Migration File

```sql
-- migrations/001_create_medical_reservation_schema.sql
-- Create medical reservation system tables

-- Step 1: Add medical fields to profile
ALTER TABLE profile
ADD COLUMN IF NOT EXISTS medical_license VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialty VARCHAR(100),
ADD COLUMN IF NOT EXISTS practice_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS appointment_approval_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_appointment_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Step 2: Create medical service catalog
CREATE TABLE IF NOT EXISTS medical_service (...);

-- Step 3: Create availability rules
CREATE TABLE IF NOT EXISTS availability_rule (...);

-- Step 4: Create time slots
CREATE TABLE IF NOT EXISTS time_slot (...);

-- Step 5: Create reservation requests
CREATE TABLE IF NOT EXISTS reservation_request (...);

-- Step 6: Create reservations
CREATE TABLE IF NOT EXISTS reservation (...);

-- Step 7: Create appointment notes
CREATE TABLE IF NOT EXISTS appointment_note (...);

-- Step 8: Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS ...;
```

#### Rollback Script

```sql
-- migrations/001_create_medical_reservation_schema_rollback.sql
-- Rollback medical reservation system

-- Drop tables in reverse order (respect dependencies)
DROP TABLE IF EXISTS appointment_note CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS reservation_request CASCADE;
DROP TABLE IF EXISTS time_slot CASCADE;
DROP TABLE IF EXISTS availability_rule CASCADE;
DROP TABLE IF EXISTS medical_service CASCADE;

-- Remove medical fields from profile
ALTER TABLE profile
DROP COLUMN IF EXISTS medical_license,
DROP COLUMN IF EXISTS specialty,
DROP COLUMN IF EXISTS practice_type,
DROP COLUMN IF EXISTS appointment_approval_required,
DROP COLUMN IF EXISTS max_appointment_duration,
DROP COLUMN IF EXISTS buffer_time_minutes,
DROP COLUMN IF EXISTS cancellation_policy;
```

## Next Steps

1. **Run migration scripts** to create database tables
2. **Update Drizzle schema exports** in index files
3. **Create repository classes** for new tables
4. **Implement service layer** for medical reservation system
5. **Set up Inngest functions** for workflow automation
