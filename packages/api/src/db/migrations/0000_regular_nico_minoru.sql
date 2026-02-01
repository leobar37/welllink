CREATE TYPE "public"."payment_method_type" AS ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'insurance', 'payment_plan');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('whatsapp', 'instagram', 'tiktok', 'facebook', 'youtube');--> statement-breakpoint
CREATE TYPE "public"."view_source" AS ENUM('qr', 'direct_link', 'referral');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"path" varchar(500) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"title" varchar(100),
	"bio" varchar(160),
	"avatar_id" uuid,
	"cover_image_id" uuid,
	"whatsapp_number" varchar(20),
	"features_config" jsonb DEFAULT '{}'::jsonb,
	"is_default" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_organization" boolean DEFAULT false NOT NULL,
	"clinic_name" varchar(100),
	"clinic_address" text,
	"clinic_phone" varchar(20),
	"clinic_email" varchar(255),
	"clinic_website" varchar(255),
	"clinic_ruc" varchar(20),
	"metadata" jsonb,
	"faq_config" jsonb DEFAULT '{"faqs":[]}'::jsonb,
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "profile_customization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"theme_id" varchar(50),
	"primary_color" varchar(7),
	"background_color" varchar(7),
	"text_color" varchar(7),
	"font_family" varchar(50),
	"button_style" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_customization_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "social_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"username" varchar(100) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_link_profile_platform_unique" UNIQUE("profile_id","platform")
);
--> statement-breakpoint
CREATE TABLE "profile_view" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"source" "view_source" NOT NULL,
	"referrer" varchar(500),
	"user_agent" varchar(500),
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_download" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"source" "view_source" DEFAULT 'qr' NOT NULL,
	"format" varchar(10) NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_link_id" uuid NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsappConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"instance_name" varchar(100) NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"token" text NOT NULL,
	"webhook_url" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"phone" varchar(20),
	"config" jsonb NOT NULL,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsappConfig_instance_id_unique" UNIQUE("instance_id")
);
--> statement-breakpoint
CREATE TABLE "whatsappMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"wa_message_id" varchar(100),
	"direction" text NOT NULL,
	"from" varchar(20) NOT NULL,
	"to" varchar(20) NOT NULL,
	"content" text,
	"media" jsonb,
	"status" text NOT NULL,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsappMessage_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "whatsappTemplate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"category" text NOT NULL,
	"language" varchar(10) DEFAULT 'es' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wa_template_id" varchar(100),
	"rejection_reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" text DEFAULT '0' NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_context" (
	"phone" varchar(20) PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"conversation_history" jsonb DEFAULT '[]'::jsonb,
	"context_summary" text,
	"last_interaction_at" timestamp,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"transferred_to_widget_at" timestamp,
	"paused_for_human_at" timestamp,
	"patient_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"price" numeric(10, 2),
	"category" varchar(100),
	"requirements" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"max_reservations" integer DEFAULT 1 NOT NULL,
	"current_reservations" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_phone" varchar(50) NOT NULL,
	"patient_email" varchar(255),
	"patient_age" integer,
	"patient_gender" varchar(20),
	"chief_complaint" text,
	"symptoms" text,
	"medical_history" text,
	"current_medications" text,
	"allergies" text,
	"urgency_level" varchar(20) DEFAULT 'normal',
	"preferred_contact_method" varchar(20) DEFAULT 'whatsapp',
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"requested_time" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"request_id" uuid,
	"patient_name" varchar(255) NOT NULL,
	"patient_phone" varchar(50) NOT NULL,
	"patient_email" varchar(255),
	"status" varchar(50) DEFAULT 'confirmed' NOT NULL,
	"source" varchar(50) DEFAULT 'whatsapp',
	"notes" text,
	"reminder_24h_sent" boolean DEFAULT false,
	"reminder_2h_sent" boolean DEFAULT false,
	"reminder_24h_scheduled" boolean DEFAULT false,
	"reminder_2h_scheduled" boolean DEFAULT false,
	"completed_at" timestamp,
	"no_show" boolean DEFAULT false,
	"price_at_booking" numeric(10, 2),
	"payment_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "availability_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration" integer DEFAULT 30 NOT NULL,
	"buffer_time" integer DEFAULT 0 NOT NULL,
	"max_appointments_per_slot" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"label" text DEFAULT 'consumidor' NOT NULL,
	"notes" text,
	"last_contact_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"objective" varchar(100),
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"template_id" uuid,
	"name" varchar(255) NOT NULL,
	"objective" varchar(100) NOT NULL,
	"message_content" text NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_audience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"whatsapp_message_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"instructions" text,
	"details" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"tone_preset" varchar(20) DEFAULT 'professional' NOT NULL,
	"custom_instructions" text,
	"welcome_message" text NOT NULL,
	"farewell_message" text,
	"suggestions" jsonb NOT NULL,
	"widget_enabled" boolean DEFAULT true NOT NULL,
	"widget_position" varchar(20) DEFAULT 'bottom-right' NOT NULL,
	"widget_primary_color" varchar(20),
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"whatsapp_auto_transfer" boolean DEFAULT true NOT NULL,
	"whatsapp_max_message_length" integer DEFAULT 4096 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_avatar_id_asset_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_cover_image_id_asset_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_customization" ADD CONSTRAINT "profile_customization_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_link" ADD CONSTRAINT "social_link_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_download" ADD CONSTRAINT "qr_download_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_click" ADD CONSTRAINT "social_click_social_link_id_social_link_id_fk" FOREIGN KEY ("social_link_id") REFERENCES "public"."social_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsappConfig" ADD CONSTRAINT "whatsappConfig_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsappMessage" ADD CONSTRAINT "whatsappMessage_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsappTemplate" ADD CONSTRAINT "whatsappTemplate_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_context" ADD CONSTRAINT "whatsapp_context_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_service" ADD CONSTRAINT "medical_service_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_slot_id_time_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."time_slot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_approved_by_profile_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_slot_id_time_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."time_slot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_request_id_reservation_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."reservation_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_template" ADD CONSTRAINT "campaign_template_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_template_id_campaign_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."campaign_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_whatsapp_message_id_whatsappMessage_id_fk" FOREIGN KEY ("whatsapp_message_id") REFERENCES "public"."whatsappMessage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentConfig" ADD CONSTRAINT "agentConfig_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "asset_user_id_idx" ON "asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_user_id_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_username_idx" ON "profile" USING btree ("username");--> statement-breakpoint
CREATE INDEX "profile_is_organization_idx" ON "profile" USING btree ("is_organization");--> statement-breakpoint
CREATE INDEX "social_link_profile_id_idx" ON "social_link" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_view_profile_id_idx" ON "profile_view" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_view_viewed_at_idx" ON "profile_view" USING btree ("profile_id","viewed_at");--> statement-breakpoint
CREATE INDEX "qr_download_profile_id_idx" ON "qr_download" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "qr_download_downloaded_at_idx" ON "qr_download" USING btree ("profile_id","downloaded_at");--> statement-breakpoint
CREATE INDEX "qr_download_source_idx" ON "qr_download" USING btree ("source");--> statement-breakpoint
CREATE INDEX "social_click_social_link_id_idx" ON "social_click" USING btree ("social_link_id");--> statement-breakpoint
CREATE INDEX "social_click_clicked_at_idx" ON "social_click" USING btree ("social_link_id","clicked_at");--> statement-breakpoint
CREATE INDEX "whatsapp_config_profile_id_idx" ON "whatsappConfig" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "whatsapp_config_instance_id_idx" ON "whatsappConfig" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "whatsapp_config_enabled_idx" ON "whatsappConfig" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "whatsapp_message_config_id_idx" ON "whatsappMessage" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_message_id_idx" ON "whatsappMessage" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_wa_message_id_idx" ON "whatsappMessage" USING btree ("wa_message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_from_to_idx" ON "whatsappMessage" USING btree ("from","to");--> statement-breakpoint
CREATE INDEX "whatsapp_message_status_idx" ON "whatsappMessage" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_message_created_at_idx" ON "whatsappMessage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_template_config_id_idx" ON "whatsappTemplate" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "whatsapp_template_name_idx" ON "whatsappTemplate" USING btree ("name");--> statement-breakpoint
CREATE INDEX "whatsapp_template_status_idx" ON "whatsappTemplate" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_template_category_idx" ON "whatsappTemplate" USING btree ("category");--> statement-breakpoint
CREATE INDEX "whatsapp_template_active_idx" ON "whatsappTemplate" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_context_profile_id_idx" ON "whatsapp_context" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "whatsapp_context_status_idx" ON "whatsapp_context" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_context_patient_id_idx" ON "whatsapp_context" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "whatsapp_context_last_interaction_at_idx" ON "whatsapp_context" USING btree ("last_interaction_at");--> statement-breakpoint
CREATE INDEX "whatsapp_context_created_at_idx" ON "whatsapp_context" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_medical_service_profile_id" ON "medical_service" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_medical_service_category" ON "medical_service" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_medical_service_active" ON "medical_service" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_time_slot_profile_id" ON "time_slot" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_time_slot_service_id" ON "time_slot" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_time_slot_start_time" ON "time_slot" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_time_slot_status" ON "time_slot" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_time_slot_expires" ON "time_slot" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_request_profile_id" ON "reservation_request" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_request_slot_id" ON "reservation_request" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "idx_request_status" ON "reservation_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_request_expires" ON "reservation_request" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_request_patient_phone" ON "reservation_request" USING btree ("patient_phone");--> statement-breakpoint
CREATE INDEX "idx_reservation_profile_id" ON "reservation" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_slot_id" ON "reservation" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_status" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservation_patient_phone" ON "reservation" USING btree ("patient_phone");--> statement-breakpoint
CREATE INDEX "idx_reservation_created" ON "reservation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_availability_profile_id" ON "availability_rule" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_availability_day" ON "availability_rule" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_availability_active" ON "availability_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "client_profile_id_idx" ON "client" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "client_phone_idx" ON "client" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "client_label_idx" ON "client" USING btree ("label");--> statement-breakpoint
CREATE INDEX "client_last_contact_at_idx" ON "client" USING btree ("last_contact_at");--> statement-breakpoint
CREATE INDEX "client_note_client_id_idx" ON "client_note" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_note_profile_id_idx" ON "client_note" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "campaign_template_profile_id_idx" ON "campaign_template" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "campaign_template_name_idx" ON "campaign_template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "campaign_profile_id_idx" ON "campaign" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "campaign_status_idx" ON "campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_scheduled_at_idx" ON "campaign" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "campaign_template_id_idx" ON "campaign" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "campaign_audience_profile_id_idx" ON "campaign_audience" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "campaign_audience_campaign_id_idx" ON "campaign_audience" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_audience_client_id_idx" ON "campaign_audience" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "campaign_audience_status_idx" ON "campaign_audience" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_audience_whatsapp_message_id_idx" ON "campaign_audience" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_audience_campaign_client_idx" ON "campaign_audience" USING btree ("campaign_id","client_id");--> statement-breakpoint
CREATE INDEX "idx_payment_method_profile_id" ON "payment_method" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_payment_method_type" ON "payment_method" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_payment_method_active" ON "payment_method" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "agent_config_profile_id_idx" ON "agentConfig" USING btree ("profile_id");