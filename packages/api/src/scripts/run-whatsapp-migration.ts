import { db } from "../db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Creating WhatsApp tables...");

    // Create whatsappConfig table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "whatsappConfig" (
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
        CONSTRAINT "whatsappConfig_instance_id_unique" UNIQUE("instance_id"),
        CONSTRAINT "whatsappConfig_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action
      );
    `);

    // Create whatsappMessage table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "whatsappMessage" (
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
        CONSTRAINT "whatsappMessage_message_id_unique" UNIQUE("message_id"),
        CONSTRAINT "whatsappMessage_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action
      );
    `);

    // Create whatsappTemplate table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "whatsappTemplate" (
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
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "whatsappTemplate_config_id_whatsappConfig_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."whatsappConfig"("id") ON DELETE cascade ON UPDATE no action
      );
    `);

    // Create indexes for whatsappConfig
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_config_profile_id_idx" ON "whatsappConfig" USING btree ("profile_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_config_instance_id_idx" ON "whatsappConfig" USING btree ("instance_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_config_enabled_idx" ON "whatsappConfig" USING btree ("is_enabled");`);

    // Create indexes for whatsappMessage
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_config_id_idx" ON "whatsappMessage" USING btree ("config_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_message_id_idx" ON "whatsappMessage" USING btree ("message_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_wa_message_id_idx" ON "whatsappMessage" USING btree ("wa_message_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_from_to_idx" ON "whatsappMessage" USING btree ("from","to");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_status_idx" ON "whatsappMessage" USING btree ("status");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_message_created_at_idx" ON "whatsappMessage" USING btree ("created_at");`);

    // Create indexes for whatsappTemplate
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_template_config_id_idx" ON "whatsappTemplate" USING btree ("config_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_template_name_idx" ON "whatsappTemplate" USING btree ("name");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_template_status_idx" ON "whatsappTemplate" USING btree ("status");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_template_category_idx" ON "whatsappTemplate" USING btree ("category");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "whatsapp_template_active_idx" ON "whatsappTemplate" USING btree ("is_active");`);

    console.log("✅ WhatsApp tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

runMigration();