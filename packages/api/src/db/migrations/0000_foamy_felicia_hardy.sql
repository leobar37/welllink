DO $$ BEGIN
  CREATE TYPE "public"."social_platform" AS ENUM('whatsapp', 'instagram', 'tiktok', 'facebook', 'youtube');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."view_source" AS ENUM('qr', 'direct_link', 'referral');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
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
	"type" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"username" varchar(50) NOT NULL,
	"title" varchar(100),
	"bio" varchar(160),
	"avatar_id" uuid,
	"cover_image_id" uuid,
	"whatsapp_number" varchar(20),
	"is_default" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
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
	"url" varchar(500) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_link_profile_platform_unique" UNIQUE("profile_id","platform")
);
--> statement-breakpoint
CREATE TABLE "health_survey_response" (
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
CREATE TABLE "social_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_link_id" uuid NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "health_survey_response" ADD CONSTRAINT "health_survey_response_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_click" ADD CONSTRAINT "social_click_social_link_id_social_link_id_fk" FOREIGN KEY ("social_link_id") REFERENCES "public"."social_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "asset_user_id_idx" ON "asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_user_id_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_username_idx" ON "profile" USING btree ("username");--> statement-breakpoint
CREATE INDEX "social_link_profile_id_idx" ON "social_link" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "health_survey_profile_id_idx" ON "health_survey_response" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "health_survey_created_at_idx" ON "health_survey_response" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "health_survey_visitor_phone_idx" ON "health_survey_response" USING btree ("visitor_phone");--> statement-breakpoint
CREATE INDEX "health_survey_visitor_whatsapp_idx" ON "health_survey_response" USING btree ("visitor_whatsapp");--> statement-breakpoint
CREATE INDEX "profile_view_profile_id_idx" ON "profile_view" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_view_viewed_at_idx" ON "profile_view" USING btree ("profile_id","viewed_at");--> statement-breakpoint
CREATE INDEX "social_click_social_link_id_idx" ON "social_click" USING btree ("social_link_id");--> statement-breakpoint
CREATE INDEX "social_click_clicked_at_idx" ON "social_click" USING btree ("social_link_id","clicked_at");
