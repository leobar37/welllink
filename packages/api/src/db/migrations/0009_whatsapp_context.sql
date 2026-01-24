-- Migration: Create whatsapp_context table for WhatsApp AI agent
-- Supports quick FAQ responses and context persistence for chat widget transfer

--> statement-breakpoint: Create whatsapp_context table for tracking WhatsApp conversations

CREATE TABLE IF NOT EXISTS whatsapp_context (
    phone VARCHAR(20) PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    conversation_history JSONB DEFAULT '{}'::jsonb,
    context_summary TEXT,
    last_interaction_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    transferred_to_widget_at TIMESTAMP,
    paused_for_human_at TIMESTAMP,
    patient_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint: Create indexes for whatsapp_context table

CREATE INDEX IF NOT EXISTS whatsapp_context_profile_id_idx ON whatsapp_context(profile_id);
CREATE INDEX IF NOT EXISTS whatsapp_context_status_idx ON whatsapp_context(status);
CREATE INDEX IF NOT EXISTS whatsapp_context_patient_id_idx ON whatsapp_context(patient_id);
CREATE INDEX IF NOT EXISTS whatsapp_context_last_interaction_at_idx ON whatsapp_context(last_interaction_at);
CREATE INDEX IF NOT EXISTS whatsapp_context_created_at_idx ON whatsapp_context(created_at);
