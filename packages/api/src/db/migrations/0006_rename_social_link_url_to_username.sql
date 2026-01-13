-- Step 1: Add username column
ALTER TABLE "social_link" ADD COLUMN "username" varchar(100);
--> statement-breakpoint

-- Step 2: Populate username from existing URLs
UPDATE "social_link" SET "username" =
  CASE
    -- Instagram: https://instagram.com/username or https://www.instagram.com/username
    WHEN platform = 'instagram' AND url ~* '^https?://(?:www\.)?instagram\.com/([^/?]+)' THEN
      regexp_replace(url, '^https?://(?:www\.)?instagram\.com/([^/?]+).*', '\1')
    -- TikTok: https://tiktok.com/@username or https://www.tiktok.com/@username
    WHEN platform = 'tiktok' AND url ~* '^https?://(?:www\.)?tiktok\.com/@([^/?]+)' THEN
      regexp_replace(url, '^https?://(?:www\.)?tiktok\.com/@([^/?]+).*', '\1')
    -- Facebook: https://facebook.com/username or https://www.facebook.com/username
    WHEN platform = 'facebook' AND url ~* '^https?://(?:www\.)?facebook\.com/([^/?]+)' THEN
      regexp_replace(url, '^https?://(?:www\.)?facebook\.com/([^/?]+).*', '\1')
    -- YouTube: https://youtube.com/@handle or https://www.youtube.com/@handle
    WHEN platform = 'youtube' AND url ~* '^https?://(?:www\.)?youtube\.com/@([^/?]+)' THEN
      regexp_replace(url, '^https?://(?:www\.)?youtube\.com/@([^/?]+).*', '\1')
    -- WhatsApp: https://wa.me/phone or https://wa.me/1234567890
    WHEN platform = 'whatsapp' AND url ~* '^https?://wa\.me/([^/?]+)' THEN
      regexp_replace(url, '^https?://wa\.me/([^/?]+).*', '\1')
    ELSE url
  END
WHERE "username" IS NULL;
--> statement-breakpoint

-- Step 3: Make username column NOT NULL
ALTER TABLE "social_link" ALTER COLUMN "username" SET NOT NULL;
--> statement-breakpoint

-- Step 4: Drop the old url column
ALTER TABLE "social_link" DROP COLUMN "url";
