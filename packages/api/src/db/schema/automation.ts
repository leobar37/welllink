import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

/**
 * Automation table - stores automation configurations
 * Each automation belongs to a profile and has multiple triggers and actions
 */
export const automation = pgTable(
  "automation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Whether the automation is active
    enabled: boolean("enabled").notNull().default(true),
    // Priority for execution order (lower = higher priority)
    priority: varchar("priority", { length: 10 }).default("normal"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("automation_profile_id_idx").on(table.profileId),
    index("automation_enabled_idx").on(table.enabled),
  ],
);

export type Automation = typeof automation.$inferSelect;
export type NewAutomation = typeof automation.$inferInsert;
