import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

// Tone presets configuration
export type TonePreset = "formal" | "professional" | "friendly";

// Agent configuration type
export interface AgentConfigData {
  // Tone settings
  tonePreset: TonePreset;
  customInstructions?: string;

  // Messages
  welcomeMessage: string;
  farewellMessage?: string;

  // Suggestions for chat
  suggestions: string[];

  // Chat widget settings
  widgetEnabled: boolean;
  widgetPosition: "bottom-right" | "bottom-left";
  widgetPrimaryColor?: string;

  // WhatsApp chatbot settings
  whatsappEnabled: boolean;
  whatsappAutoTransfer: boolean;
  whatsappMaxMessageLength: number;
}

// Default agent configuration
export const defaultAgentConfig: AgentConfigData = {
  tonePreset: "professional",
  customInstructions: "",
  welcomeMessage:
    "¡Hola! Soy el asistente virtual de {nombre}. Estoy aquí para responder tus preguntas y ayudarte a agendar citas.",
  farewellMessage: "",
  suggestions: [
    "¿Qué servicios ofrecen?",
    "¿Cómo agendo una cita?",
    "¿Cuáles son sus horarios?",
  ],
  widgetEnabled: true,
  widgetPosition: "bottom-right",
  widgetPrimaryColor: "#0066cc",
  whatsappEnabled: true,
  whatsappAutoTransfer: true,
  whatsappMaxMessageLength: 4096,
};

export const agentConfig = pgTable(
  "agentConfig",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),

    // Tone settings
    tonePreset: varchar("tone_preset", { length: 20 })
      .notNull()
      .default("professional"),
    customInstructions: text("custom_instructions"),

    // Messages
    welcomeMessage: text("welcome_message").notNull(),
    farewellMessage: text("farewell_message"),

    // Suggestions (stored as JSON array)
    suggestions: jsonb("suggestions").$type<string[]>().notNull(),

    // Chat widget settings
    widgetEnabled: boolean("widget_enabled").notNull().default(true),
    widgetPosition: varchar("widget_position", { length: 20 })
      .notNull()
      .default("bottom-right"),
    widgetPrimaryColor: varchar("widget_primary_color", { length: 20 }),

    // WhatsApp chatbot settings
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
    whatsappAutoTransfer: boolean("whatsapp_auto_transfer")
      .notNull()
      .default(true),
    whatsappMaxMessageLength: integer("whatsapp_max_message_length")
      .notNull()
      .default(4096),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("agent_config_profile_id_idx").on(table.profileId)],
);

export type AgentConfig = typeof agentConfig.$inferSelect;
export type NewAgentConfig = typeof agentConfig.$inferInsert;
