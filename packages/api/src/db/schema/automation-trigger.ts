import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { automation } from "./automation";
import { automationTriggerTypeEnum } from "./enums";

/**
 * Trigger configuration types for each trigger type
 */
export interface EventTriggerConfig {
  // Event types: appointment.created, appointment.completed, appointment.cancelled,
  // client.created, client.updated, service.completed, stock.low, etc.
  eventType: string;
  // Optional filters for the event data
  filters?: Record<string, unknown>;
}

export interface ScheduleTriggerConfig {
  // Cron expression for schedule-based triggers
  cronExpression: string;
  // Timezone for the schedule
  timezone?: string;
  // Optional: specific days of week (1-7, Mon-Sun)
  daysOfWeek?: number[];
  // Optional: specific hours (0-23)
  hours?: number[];
}

export interface ConditionTriggerConfig {
  // Database query to evaluate
  entityType: string; // appointment, client, product, inventory, etc.
  // JSON conditions to evaluate
  conditions: {
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "is_null";
    value: unknown;
  }[];
  // Logical operator for combining conditions
  logicalOperator?: "AND" | "OR";
  // Polling interval in minutes
  pollInterval?: number;
}

/**
 * Birthday trigger config - fires on client birthday
 */
export interface BirthdayTriggerConfig {
  // Days before birthday to send (e.g., -7 means a week before)
  daysBefore?: number;
  // Days after birthday to still send (for catch-up)
  daysAfter?: number;
}

/**
 * Inactivity trigger config - fires when client has no appointment in X days
 */
export interface InactivityTriggerConfig {
  // Number of days of inactivity to trigger
  daysInactive: number;
  // Optional: minimum number of past appointments (to only trigger for clients who have been customers before)
  minAppointments?: number;
}

/**
 * Anniversary trigger config - fires on client registration anniversary
 */
export interface AnniversaryTriggerConfig {
  // Anniversary type: yearly (1, 2, 3... years), quarterly, monthly
  anniversaryType: "yearly" | "quarterly" | "monthly";
  // Days before anniversary to send
  daysBefore?: number;
  // Days after anniversary to still send
  daysAfter?: number;
  // Minimum years/months since registration (e.g., only trigger after 1 year)
  minPeriods?: number;
}

/**
 * Low stock trigger config - fires when product hits min_stock threshold
 */
export interface LowStockTriggerConfig {
  // Optional: specific product IDs to monitor (empty = all products)
  productIds?: string[];
  // Optional: specific category IDs to monitor
  categoryIds?: string[];
  // Whether to trigger once per product until stock is replenished
  oneTimeUntilReplenished?: boolean;
}

/**
 * No-show trigger config - fires when appointment marked as no-show
 */
export interface NoShowTriggerConfig {
  // Optional: delay in hours before sending follow-up (default: immediately)
  delayHours?: number;
}

/**
 * Automation trigger table - defines when automation fires
 * An automation can have multiple triggers (OR logic - any trigger fires the automation)
 */
export const automationTrigger = pgTable(
  "automation_trigger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    automationId: uuid("automation_id")
      .notNull()
      .references(() => automation.id, { onDelete: "cascade" }),
    // Trigger type: event, schedule, condition
    type: automationTriggerTypeEnum("type").notNull(),
    // Name/label for the trigger
    name: varchar("name", { length: 255 }),
    // JSON configuration based on trigger type
    config: jsonb("config").$type<
      | EventTriggerConfig
      | ScheduleTriggerConfig
      | ConditionTriggerConfig
      | BirthdayTriggerConfig
      | InactivityTriggerConfig
      | AnniversaryTriggerConfig
      | LowStockTriggerConfig
      | NoShowTriggerConfig
    >(),
    // Whether this trigger is active
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("automation_trigger_automation_id_idx").on(table.automationId),
    index("automation_trigger_type_idx").on(table.type),
  ],
);

export type AutomationTrigger = typeof automationTrigger.$inferSelect;
export type NewAutomationTrigger = typeof automationTrigger.$inferInsert;
