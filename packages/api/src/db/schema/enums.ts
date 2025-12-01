import { pgEnum } from "drizzle-orm/pg-core";

export const socialPlatformEnum = pgEnum("social_platform", [
  "whatsapp",
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
]);

export const viewSourceEnum = pgEnum("view_source", [
  "qr",
  "direct_link",
  "referral",
]);

export const storyTypeEnum = pgEnum("story_type", ["self", "client"]);

export const storyEventTypeEnum = pgEnum("story_event_type", [
  "section_viewed",
  "story_changed",
  "text_opened",
  "cta_clicked",
]);
