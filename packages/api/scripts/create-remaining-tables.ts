import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

async function createRemainingTables() {
  console.log("🔄 Creating remaining tables...\n");

  try {
    // Create social_platform enum if not exists
    try {
      await sql`CREATE TYPE "social_platform" AS ENUM('whatsapp', 'instagram', 'tiktok', 'facebook', 'youtube');`;
      console.log("✅ Created social_platform enum");
    } catch (e) {
      console.log("ℹ️  social_platform enum already exists");
    }

    // Create view_source enum if not exists
    try {
      await sql`CREATE TYPE "view_source" AS ENUM('qr', 'direct_link', 'referral');`;
      console.log("✅ Created view_source enum");
    } catch (e) {
      console.log("ℹ️  view_source enum already exists");
    }

    // Create asset table
    await sql`
      CREATE TABLE IF NOT EXISTS "asset" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "path" varchar(500) NOT NULL,
        "filename" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "size" integer NOT NULL,
        "type" varchar(50),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "asset_path_unique" UNIQUE("path")
      )
    `;
    console.log("✅ Created asset table");

    // Create asset_user_id_idx index
    await sql`CREATE INDEX IF NOT EXISTS "asset_user_id_idx" ON "asset" USING btree ("user_id")`;
    console.log("✅ Created asset_user_id_idx index");

    // Create profile table
    await sql`
      CREATE TABLE IF NOT EXISTS "profile" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "username" varchar(50) NOT NULL,
        "display_name" varchar(100),
        "title" varchar(100),
        "bio" varchar(160),
        "avatar_id" uuid,
        "cover_image_id" uuid,
        "whatsapp_number" varchar(20),
        "features_config" jsonb,
        "is_default" boolean DEFAULT true NOT NULL,
        "is_published" boolean DEFAULT false NOT NULL,
        "onboarding_step" integer DEFAULT 0 NOT NULL,
        "onboarding_completed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "profile_username_unique" UNIQUE("username")
      )
    `;
    console.log("✅ Created profile table");

    // Add FK constraints
    try {
      await sql`ALTER TABLE "profile" ADD CONSTRAINT IF NOT EXISTS "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {
      // Constraint might already exist
    }
    try {
      await sql`ALTER TABLE "profile" ADD CONSTRAINT IF NOT EXISTS "profile_avatar_id_asset_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "asset"("id") ON DELETE set null ON UPDATE no action`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE "profile" ADD CONSTRAINT IF NOT EXISTS "profile_cover_image_id_asset_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "asset"("id") ON DELETE set null ON UPDATE no action`;
    } catch (e) {}

    // Create profile_user_id_idx index
    await sql`CREATE INDEX IF NOT EXISTS "profile_user_id_idx" ON "profile" USING btree ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "profile_username_idx" ON "profile" USING btree ("username")`;
    console.log("✅ Created profile indexes");

    // Create profile_customization table
    await sql`
      CREATE TABLE IF NOT EXISTS "profile_customization" (
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
      )
    `;
    console.log("✅ Created profile_customization table");

    try {
      await sql`ALTER TABLE "profile_customization" ADD CONSTRAINT IF NOT EXISTS "profile_customization_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    // Create social_link table
    await sql`
      CREATE TABLE IF NOT EXISTS "social_link" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "profile_id" uuid NOT NULL,
        "platform" "social_platform" NOT NULL,
        "url" varchar(500) NOT NULL,
        "display_order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "social_link_profile_platform_unique" UNIQUE("profile_id","platform")
      )
    `;
    console.log("✅ Created social_link table");

    try {
      await sql`ALTER TABLE "social_link" ADD CONSTRAINT IF NOT EXISTS "social_link_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    await sql`CREATE INDEX IF NOT EXISTS "social_link_profile_id_idx" ON "social_link" USING btree ("profile_id")`;
    console.log("✅ Created social_link indexes");

    // Create health_survey_response table
    await sql`
      CREATE TABLE IF NOT EXISTS "health_survey_response" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "profile_id" uuid NOT NULL,
        "visitor_name" varchar(200) NOT NULL,
        "visitor_phone" varchar(20),
        "visitor_email" varchar(255),
        "visitor_whatsapp" varchar(20),
        "referred_by" varchar(200),
        "responses" jsonb NOT NULL,
        "whatsapp_sent_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ Created health_survey_response table");

    try {
      await sql`ALTER TABLE "health_survey_response" ADD CONSTRAINT IF NOT EXISTS "health_survey_response_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    await sql`CREATE INDEX IF NOT EXISTS "health_survey_profile_id_idx" ON "health_survey_response" USING btree ("profile_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "health_survey_created_at_idx" ON "health_survey_response" USING btree ("profile_id","created_at")`;
    await sql`CREATE INDEX IF NOT EXISTS "health_survey_visitor_phone_idx" ON "health_survey_response" USING btree ("visitor_phone")`;
    await sql`CREATE INDEX IF NOT EXISTS "health_survey_visitor_whatsapp_idx" ON "health_survey_response" USING btree ("visitor_whatsapp")`;
    console.log("✅ Created health_survey_response indexes");

    // Create profile_view table
    await sql`
      CREATE TABLE IF NOT EXISTS "profile_view" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "profile_id" uuid NOT NULL,
        "source" "view_source" NOT NULL,
        "referrer" varchar(500),
        "user_agent" varchar(500),
        "viewed_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ Created profile_view table");

    try {
      await sql`ALTER TABLE "profile_view" ADD CONSTRAINT IF NOT EXISTS "profile_view_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    await sql`CREATE INDEX IF NOT EXISTS "profile_view_profile_id_idx" ON "profile_view" USING btree ("profile_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "profile_view_viewed_at_idx" ON "profile_view" USING btree ("profile_id","viewed_at")`;
    console.log("✅ Created profile_view indexes");

    // Create social_click table
    await sql`
      CREATE TABLE IF NOT EXISTS "social_click" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "social_link_id" uuid NOT NULL,
        "clicked_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ Created social_click table");

    try {
      await sql`ALTER TABLE "social_click" ADD CONSTRAINT IF NOT EXISTS "social_click_social_link_id_social_link_id_fk" FOREIGN KEY ("social_link_id") REFERENCES "social_link"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    await sql`CREATE INDEX IF NOT EXISTS "social_click_social_link_id_idx" ON "social_click" USING btree ("social_link_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "social_click_clicked_at_idx" ON "social_click" USING btree ("social_link_id","clicked_at")`;
    console.log("✅ Created social_click indexes");

    // Create qr_download table
    await sql`
      CREATE TABLE IF NOT EXISTS "qr_download" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "profile_id" uuid NOT NULL,
        "source" "view_source" NOT NULL,
        "downloaded_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ Created qr_download table");

    try {
      await sql`ALTER TABLE "qr_download" ADD CONSTRAINT IF NOT EXISTS "qr_download_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {}

    await sql`CREATE INDEX IF NOT EXISTS "qr_download_profile_id_idx" ON "qr_download" USING btree ("profile_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "qr_download_downloaded_at_idx" ON "qr_download" USING btree ("profile_id","downloaded_at")`;
    await sql`CREATE INDEX IF NOT EXISTS "qr_download_source_idx" ON "qr_download" USING btree ("source")`;
    console.log("✅ Created qr_download indexes");

    console.log("\n✅ All tables created successfully!");

    await sql.end();
  } catch (error) {
    console.error("\n❌ Error creating tables:", error);
    await sql.end();
    process.exit(1);
  }
}

createRemainingTables();
