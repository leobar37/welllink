-- Migration: automation_template
-- Created at: 2026-03-08

-- Create automation_template table
CREATE TABLE IF NOT EXISTS automation_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  category varchar(100) NOT NULL,
  business_type_key varchar(50) NOT NULL,
  icon varchar(50),
  is_active boolean NOT NULL DEFAULT true,
  default_name varchar(255),
  default_description text,
  trigger_config jsonb,
  action_configs jsonb,
  usage_count integer NOT NULL DEFAULT 0,
  tags jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS automation_template_business_type_key_idx ON automation_template(business_type_key);
CREATE INDEX IF NOT EXISTS automation_template_category_idx ON automation_template(category);
CREATE INDEX IF NOT EXISTS automation_template_is_active_idx ON automation_template(is_active);
