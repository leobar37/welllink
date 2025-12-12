import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export interface WhatsAppConfigData {
  instanceName: string;
  instanceId: string;
  token: string;
  webhookUrl: string;
  qrcode: boolean;
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
  };
  chatbot: {
    enabled: boolean;
    ignoreGroups: boolean;
    ignoreBroadcast: boolean;
  };
}

export const whatsappConfig = pgTable(
  "whatsappConfig",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    instanceName: varchar("instance_name", { length: 100 }).notNull(),
    instanceId: varchar("instance_id", { length: 100 }).notNull().unique(),
    token: text("token").notNull(),
    webhookUrl: text("webhook_url"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    isConnected: boolean("is_connected").notNull().default(false),
    phone: varchar("phone", { length: 20 }),
    config: jsonb("config")
      .$type<WhatsAppConfigData>()
      .notNull(),
    lastActivityAt: timestamp("last_activity_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("whatsapp_config_profile_id_idx").on(table.profileId),
    index("whatsapp_config_instance_id_idx").on(table.instanceId),
    index("whatsapp_config_enabled_idx").on(table.isEnabled),
  ],
);

export type WhatsAppConfig = typeof whatsappConfig.$inferSelect;
export type NewWhatsAppConfig = typeof whatsappConfig.$inferInsert;