import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { automation } from "./automation";
import { automationActionTypeEnum } from "./enums";

/**
 * Action configuration types for each action type
 */
export interface WhatsAppActionConfig {
  // Phone number or client ID to send to
  recipientType: "client" | "phone" | "variable";
  // Phone number (if recipientType is phone)
  phoneNumber?: string;
  // Client ID (if recipientType is client)
  clientId?: string;
  // Variable path in trigger data (if recipientType is variable)
  variablePath?: string;
  // Message template or text
  message: string;
  // Template ID (if using WhatsApp template)
  templateId?: string;
}

export interface EmailActionConfig {
  // Email recipient
  recipientType: "client" | "email" | "variable";
  // Email address (if recipientType is email)
  email?: string;
  // Client ID (if recipientType is client)
  clientId?: string;
  // Variable path in trigger data (if recipientType is variable)
  variablePath?: string;
  // Email subject
  subject: string;
  // Email body (supports HTML)
  body: string;
  // From name (optional)
  fromName?: string;
}

export interface UpdateRecordActionConfig {
  // Entity type to update
  entityType: string; // appointment, client, product, inventory, etc.
  // Entity ID (can be variable)
  entityIdType: "fixed" | "variable";
  // Fixed entity ID
  entityId?: string;
  // Variable path to entity ID in trigger data
  entityIdVariablePath?: string;
  // Fields to update
  updates: Record<string, unknown>;
}

export interface CreateTaskActionConfig {
  // Task title
  title: string;
  // Task description (supports variables)
  description?: string;
  // Assign to staff member (staff ID or variable)
  assignToType: "staff" | "owner" | "variable";
  staffId?: string;
  assignToVariablePath?: string;
  // Due date (can be relative or absolute)
  dueDateType: "relative" | "absolute" | "variable";
  // Relative due date (e.g., "+1d", "+1w")
  relativeDueDate?: string;
  // Absolute due date (ISO string)
  absoluteDueDate?: string;
  // Variable path for due date
  dueDateVariablePath?: string;
  // Priority
  priority: "low" | "normal" | "high";
}

/**
 * Automation action table - defines what happens when automation fires
 * An automation can have multiple actions that execute in order
 */
export const automationAction = pgTable(
  "automation_action",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    automationId: uuid("automation_id")
      .notNull()
      .references(() => automation.id, { onDelete: "cascade" }),
    // Action type: whatsapp, email, update_record, create_task
    type: automationActionTypeEnum("type").notNull(),
    // Name/label for the action
    name: varchar("name", { length: 255 }),
    // Order of execution (lower = first)
    order: integer("order").notNull().default(0),
    // JSON configuration based on action type
    config: jsonb("config").$type<
      | WhatsAppActionConfig
      | EmailActionConfig
      | UpdateRecordActionConfig
      | CreateTaskActionConfig
    >(),
    // Whether this action is active
    isActive: boolean("is_active").notNull().default(true),
    // Timeout in seconds for this action
    timeoutSeconds: integer("timeout_seconds").default(30),
    // Continue on error (don't stop execution if this action fails)
    continueOnError: boolean("continue_on_error").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("automation_action_automation_id_idx").on(table.automationId),
    index("automation_action_type_idx").on(table.type),
    index("automation_action_order_idx").on(table.order),
  ],
);

export type AutomationAction = typeof automationAction.$inferSelect;
export type NewAutomationAction = typeof automationAction.$inferInsert;
