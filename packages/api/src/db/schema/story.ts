import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { asset } from "./asset";
import { storyTypeEnum } from "./enums";

export const story = pgTable(
  "story",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    type: storyTypeEnum("type").notNull().default("self"),
    title: varchar("title", { length: 160 }).notNull(),
    beforeAssetId: uuid("before_asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "restrict" }),
    afterAssetId: uuid("after_asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "restrict" }),
    text: text("text"),
    order: integer("display_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("story_profile_id_idx").on(table.profileId),
    index("story_order_idx").on(table.profileId, table.order),
  ],
);

export type Story = typeof story.$inferSelect;
export type NewStory = typeof story.$inferInsert;
