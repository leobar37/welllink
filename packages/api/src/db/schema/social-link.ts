import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { socialPlatformEnum } from "./enums";

export const socialLink = pgTable(
  "social_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("social_link_profile_id_idx").on(table.profileId),
    unique("social_link_profile_platform_unique").on(
      table.profileId,
      table.platform
    ),
  ]
);

export type SocialLink = typeof socialLink.$inferSelect;
export type NewSocialLink = typeof socialLink.$inferInsert;
