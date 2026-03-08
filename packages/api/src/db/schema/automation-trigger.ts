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
      EventTriggerConfig | ScheduleTriggerConfig | ConditionTriggerConfig
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
