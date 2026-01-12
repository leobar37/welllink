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
