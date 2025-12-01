import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const storySection = pgTable(
  "story_section",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull().default("Mi historia"),
    intro: text("intro"),
    ctaLabel: varchar("cta_label", { length: 120 }),
    ctaUrl: varchar("cta_url", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("story_section_profile_id_idx").on(table.profileId),
  ],
);

export type StorySection = typeof storySection.$inferSelect;
export type NewStorySection = typeof storySection.$inferInsert;
