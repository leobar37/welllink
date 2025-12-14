import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const campaignTemplate = pgTable(
  "campaign_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    objective: varchar("objective", { length: 100 }),
    variables: jsonb("variables").$type<string[]>().notNull().default([]),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaign_template_profile_id_idx").on(table.profileId),
    index("campaign_template_name_idx").on(table.name),
  ],
);

export type CampaignTemplate = typeof campaignTemplate.$inferSelect;
export type NewCampaignTemplate = typeof campaignTemplate.$inferInsert;
