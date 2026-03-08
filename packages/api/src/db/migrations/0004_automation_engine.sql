-- Automation Engine Schema
-- Tables: automation, automation_trigger, automation_action, automation_execution_log

-- Automation trigger type enum
CREATE TYPE "automation_trigger_type" AS ENUM ('event', 'schedule', 'condition');

-- Automation action type enum
CREATE TYPE "automation_action_type" AS ENUM ('whatsapp', 'email', 'update_record', 'create_task');

-- Automation execution status enum
CREATE TYPE "automation_execution_status" AS ENUM ('pending', 'running', 'success', 'partial', 'failed');

-- Automation table - stores automation configurations
CREATE TABLE "automation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profile" ("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "description" text,
    "enabled" boolean NOT NULL DEFAULT true,
    "priority" varchar(10) DEFAULT 'normal',
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Automation trigger table - defines when automation fires
CREATE TABLE "automation_trigger" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "automation_id" uuid NOT NULL REFERENCES "automation" ("id") ON DELETE CASCADE,
    "type" automation_trigger_type NOT NULL,
    "name" varchar(255),
    "config" jsonb,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Automation action table - defines what happens when automation fires
CREATE TABLE "automation_action" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "automation_id" uuid NOT NULL REFERENCES "automation" ("id") ON DELETE CASCADE,
    "type" automation_action_type NOT NULL,
    "name" varchar(255),
    "order" integer NOT NULL DEFAULT 0,
    "config" jsonb,
    "is_active" boolean NOT NULL DEFAULT true,
    "timeout_seconds" integer DEFAULT 30,
    "continue_on_error" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Automation execution log - tracks each automation execution
CREATE TABLE "automation_execution_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "automation_id" uuid NOT NULL REFERENCES "automation" ("id") ON DELETE CASCADE,
    "trigger_type" varchar(20),
    "trigger_data" jsonb,
    "status" automation_execution_status NOT NULL DEFAULT 'pending',
    "actions_executed" jsonb,
    "result" jsonb,
    "error" text,
    "started_at" timestamp,
    "completed_at" timestamp,
    "duration_ms" integer,
    "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Indexes for automation table
CREATE INDEX "automation_profile_id_idx" ON "automation" ("profile_id");
CREATE INDEX "automation_enabled_idx" ON "automation" ("enabled");

-- Indexes for automation_trigger table
CREATE INDEX "automation_trigger_automation_id_idx" ON "automation_trigger" ("automation_id");
CREATE INDEX "automation_trigger_type_idx" ON "automation_trigger" ("type");

-- Indexes for automation_action table
CREATE INDEX "automation_action_automation_id_idx" ON "automation_action" ("automation_id");
CREATE INDEX "automation_action_type_idx" ON "automation_action" ("type");
CREATE INDEX "automation_action_order_idx" ON "automation_action" ("order");

-- Indexes for automation_execution_log table
CREATE INDEX "automation_execution_log_automation_id_idx" ON "automation_execution_log" ("automation_id");
CREATE INDEX "automation_execution_log_status_idx" ON "automation_execution_log" ("status");
CREATE INDEX "automation_execution_log_created_at_idx" ON "automation_execution_log" ("created_at");
