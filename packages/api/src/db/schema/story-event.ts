import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { story } from "./story";
import { storyEventTypeEnum } from "./enums";

export const storyEvent = pgTable(
  "story_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    storyId: uuid("story_id").references(() => story.id, {
      onDelete: "set null",
    }),
    eventType: storyEventTypeEnum("event_type").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("story_event_profile_idx").on(table.profileId, table.eventType),
    index("story_event_story_idx").on(table.storyId),
  ],
);

export type StoryEvent = typeof storyEvent.$inferSelect;
export type NewStoryEvent = typeof storyEvent.$inferInsert;
