import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { socialLink } from "./social-link";
import { viewSourceEnum } from "./enums";

export const profileView = pgTable(
  "profile_view",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    source: viewSourceEnum("source").notNull(),
    referrer: varchar("referrer", { length: 500 }),
    userAgent: varchar("user_agent", { length: 500 }),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (table) => [
    index("profile_view_profile_id_idx").on(table.profileId),
    index("profile_view_viewed_at_idx").on(table.profileId, table.viewedAt),
  ]
);

export const socialClick = pgTable(
  "social_click",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    socialLinkId: uuid("social_link_id")
      .notNull()
      .references(() => socialLink.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at").notNull().defaultNow(),
  },
  (table) => [
    index("social_click_social_link_id_idx").on(table.socialLinkId),
    index("social_click_clicked_at_idx").on(
      table.socialLinkId,
      table.clickedAt
    ),
  ]
);

export const qrDownload = pgTable(
  "qr_download",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    format: varchar("format", { length: 10 }).notNull(), // 'png' or 'svg'
    downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  },
  (table) => [
    index("qr_download_profile_id_idx").on(table.profileId),
    index("qr_download_downloaded_at_idx").on(
      table.profileId,
      table.downloadedAt,
    ),
  ],
);

export type ProfileView = typeof profileView.$inferSelect;
export type NewProfileView = typeof profileView.$inferInsert;
export type SocialClick = typeof socialClick.$inferSelect;
export type NewSocialClick = typeof socialClick.$inferInsert;
export type QRDownload = typeof qrDownload.$inferSelect;
export type NewQRDownload = typeof qrDownload.$inferInsert;
