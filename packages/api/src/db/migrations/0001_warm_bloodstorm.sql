CREATE TABLE "qr_download" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"format" varchar(10) NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "display_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_download" ADD CONSTRAINT "qr_download_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qr_download_profile_id_idx" ON "qr_download" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "qr_download_downloaded_at_idx" ON "qr_download" USING btree ("profile_id","downloaded_at");