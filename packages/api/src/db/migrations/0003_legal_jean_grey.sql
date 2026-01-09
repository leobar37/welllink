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
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"health_survey_id" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"label" text DEFAULT 'consumidor' NOT NULL,
	"notes" text,
	"last_contact_at" timestamp,
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
ALTER TABLE "whatsappConfig" ADD CONSTRAINT "whatsappConfig_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsappMessage" ADD CONSTRAINT "whatsappMessage_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsappTemplate" ADD CONSTRAINT "whatsappTemplate_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_health_survey_id_health_survey_response_id_fk" FOREIGN KEY ("health_survey_id") REFERENCES "public"."health_survey_response"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note" ADD CONSTRAINT "client_note_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note" ADD CONSTRAINT "client_note_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_template" ADD CONSTRAINT "campaign_template_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_template_id_campaign_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."campaign_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience" ADD CONSTRAINT "campaign_audience_whatsapp_message_id_whatsappMessage_id_fk" FOREIGN KEY ("whatsapp_message_id") REFERENCES "public"."whatsappMessage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "client_profile_id_idx" ON "client" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "client_phone_idx" ON "client" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "client_label_idx" ON "client" USING btree ("label");--> statement-breakpoint
CREATE INDEX "client_health_survey_id_idx" ON "client" USING btree ("health_survey_id");--> statement-breakpoint
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
CREATE UNIQUE INDEX "campaign_audience_campaign_client_idx" ON "campaign_audience" USING btree ("campaign_id","client_id");