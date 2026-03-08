import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { automation } from "./automation";
import { automationExecutionStatusEnum } from "./enums";

/**
 * Automation execution log - tracks each automation execution
 */
export const automationExecutionLog = pgTable(
  "automation_execution_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    automationId: uuid("automation_id")
      .notNull()
      .references(() => automation.id, { onDelete: "cascade" }),
    // Trigger type that caused this execution
    triggerType: varchar("trigger_type", { length: 20 }),
    // Data that triggered the automation
    triggerData: jsonb("trigger_data").$type<Record<string, unknown>>(),
    // Status of the execution
    status: automationExecutionStatusEnum("status").notNull().default("pending"),
    // Number of actions executed
    actionsExecuted: jsonb("actions_executed").$type<
      {
        actionId: string;
        actionName: string;
        actionType: string;
        success: boolean;
        result?: Record<string, unknown>;
        error?: string;
      }[]
    >(),
    // Final result summary
    result: jsonb("result").$type<{
      message?: string;
      data?: Record<string, unknown>;
    }>(),
    // Error message if execution failed
    error: text("error"),
    // Execution timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    // Duration in milliseconds
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("automation_execution_log_automation_id_idx").on(table.automationId),
    index("automation_execution_log_status_idx").on(table.status),
    index("automation_execution_log_created_at_idx").on(table.createdAt),
  ],
);

export type AutomationExecutionLog = typeof automationExecutionLog.$inferSelect;
export type NewAutomationExecutionLog = typeof automationExecutionLog.$inferInsert;
