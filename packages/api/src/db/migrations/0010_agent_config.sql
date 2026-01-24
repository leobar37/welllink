import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const agentConfig = pgTable(
  "agentConfig",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    tonePreset: varchar("tone_preset", { length: 20 })
      .notNull()
      .default("professional"),
    customInstructions: text("custom_instructions"),
    welcomeMessage: text("welcome_message").notNull(),
    farewellMessage: text("farewell_message"),
    suggestions: jsonb("suggestions").$type<string[]>().notNull(),
    widgetEnabled: boolean("widget_enabled").notNull().default(true),
    widgetPosition: varchar("widget_position", { length: 20 })
      .notNull()
      .default("bottom-right"),
    widgetPrimaryColor: varchar("widget_primary_color", { length: 20 }),
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
    whatsappAutoTransfer: boolean("whatsapp_auto_transfer").notNull().default(true),
    whatsappMaxMessageLength: integer("whatsapp_max_message_length").notNull().default(4096),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    sql`CREATE INDEX IF NOT EXISTS "agent_config_profile_id_idx" ON ${table} (${table.profileId})`,
  ],
);

export type AgentConfig = typeof agentConfig.$inferSelect;
export type NewAgentConfig = typeof agentConfig.$inferInsert;
