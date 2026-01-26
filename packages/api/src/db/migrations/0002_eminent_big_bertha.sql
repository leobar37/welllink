CREATE TYPE "public"."story_event_type" AS ENUM('section_viewed', 'story_changed', 'text_opened', 'cta_clicked');--> statement-breakpoint
CREATE TYPE "public"."story_type" AS ENUM('self', 'client');--> statement-breakpoint
CREATE TABLE "story_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" varchar(120) DEFAULT 'Mi historia' NOT NULL,
	"intro" text,
	"cta_label" varchar(120),
	"cta_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" "story_type" DEFAULT 'self' NOT NULL,
	"title" varchar(160) NOT NULL,
	"before_asset_id" uuid NOT NULL,
	"after_asset_id" uuid NOT NULL,
	"text" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"story_id" uuid,
	"event_type" "story_event_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- ai_recommendation table: REMOVED - was part of legacy wellness feature
ALTER TABLE "profile" ADD COLUMN "features_config" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "story_section" ADD CONSTRAINT "story_section_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_before_asset_id_asset_id_fk" FOREIGN KEY ("before_asset_id") REFERENCES "public"."asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_after_asset_id_asset_id_fk" FOREIGN KEY ("after_asset_id") REFERENCES "public"."asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_event" ADD CONSTRAINT "story_event_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_event" ADD CONSTRAINT "story_event_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- ai_recommendation constraints: REMOVED
CREATE UNIQUE INDEX "story_section_profile_id_idx" ON "story_section" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "story_profile_id_idx" ON "story" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "story_order_idx" ON "story" USING btree ("profile_id","display_order");--> statement-breakpoint
CREATE INDEX "story_event_profile_idx" ON "story_event" USING btree ("profile_id","event_type");--> statement-breakpoint
CREATE INDEX "story_event_story_idx" ON "story_event" USING btree ("story_id");--> statement-breakpoint
-- ai_recommendation indexes: REMOVED
