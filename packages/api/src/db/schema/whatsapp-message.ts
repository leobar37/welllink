import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  index,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { whatsappConfig } from "./whatsapp-config";

export enum MessageDirection {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

export interface MessageMedia {
  type: "image" | "video" | "audio" | "document";
  url: string;
  mimetype: string;
  filename?: string;
  caption?: string;
}

export const whatsappMessage = pgTable(
  "whatsappMessage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    messageId: varchar("message_id", { length: 100 }).notNull().unique(),
    waMessageId: varchar("wa_message_id", { length: 100 }), // WhatsApp message ID
    direction: text("direction", { enum: [MessageDirection.INBOUND, MessageDirection.OUTBOUND] })
      .notNull()
      .$default(() => MessageDirection.OUTBOUND),
    from: varchar("from", { length: 20 }).notNull(),
    to: varchar("to", { length: 20 }).notNull(),
    content: text("content"),
    media: jsonb("media").$type<MessageMedia | null>(),
    status: text("status", { enum: [MessageStatus.PENDING, MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ, MessageStatus.FAILED] })
      .notNull()
      .$default(() => MessageStatus.PENDING),
    error: text("error"),
    retryCount: integer("retry_count").notNull().default(0),
    processedAt: timestamp("processed_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("whatsapp_message_config_id_idx").on(table.configId),
    index("whatsapp_message_message_id_idx").on(table.messageId),
    index("whatsapp_message_wa_message_id_idx").on(table.waMessageId),
    index("whatsapp_message_from_to_idx").on(table.from, table.to),
    index("whatsapp_message_status_idx").on(table.status),
    index("whatsapp_message_created_at_idx").on(table.createdAt),
  ],
);

export type WhatsAppMessage = typeof whatsappMessage.$inferSelect;
export type NewWhatsAppMessage = typeof whatsappMessage.$inferInsert;