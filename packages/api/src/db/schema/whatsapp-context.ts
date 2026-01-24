import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export enum WhatsAppContextStatus {
  ACTIVE = "ACTIVE",
  TRANSFERRED_TO_WIDGET = "TRANSFERRED_TO_WIDGET",
  PAUSED_FOR_HUMAN = "PAUSED_FOR_HUMAN",
}

export const whatsappContext = pgTable(
  "whatsapp_context",
  {
    // Phone as primary key since it's unique per conversation
    phone: varchar("phone", { length: 20 }).primaryKey(),

    // Profile reference (which doctor's WhatsApp)
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),

    // Conversation history (JSON array of messages)
    conversationHistory: jsonb("conversation_history")
      .$type<
        Array<{
          role: "user" | "assistant";
          content: string;
          timestamp: number;
        }>
      >()
      .default([]),

    // Summary of the conversation for the chat widget
    contextSummary: text("context_summary"),

    // When was the last interaction
    lastInteractionAt: timestamp("last_interaction_at"),

    // Status of the context
    status: text("status", {
      enum: [
        WhatsAppContextStatus.ACTIVE,
        WhatsAppContextStatus.TRANSFERRED_TO_WIDGET,
        WhatsAppContextStatus.PAUSED_FOR_HUMAN,
      ],
    })
      .notNull()
      .default(WhatsAppContextStatus.ACTIVE),

    // Timestamps for tracking
    transferredToWidgetAt: timestamp("transferred_to_widget_at"),
    pausedForHumanAt: timestamp("paused_for_human_at"),

    // Linked patient (nullable until identified)
    patientId: uuid("patient_id"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("whatsapp_context_profile_id_idx").on(table.profileId),
    index("whatsapp_context_status_idx").on(table.status),
    index("whatsapp_context_patient_id_idx").on(table.patientId),
    index("whatsapp_context_last_interaction_at_idx").on(
      table.lastInteractionAt,
    ),
    index("whatsapp_context_created_at_idx").on(table.createdAt),
  ],
);

export type WhatsAppContext = typeof whatsappContext.$inferSelect;
export type NewWhatsAppContext = typeof whatsappContext.$inferInsert;
