import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Template trigger configuration - simplified for templates
 */
export interface TemplateTriggerConfig {
  type: "event" | "schedule" | "condition";
  eventType?: string;
  cronExpression?: string;
  daysOfWeek?: number[];
  hours?: number[];
  conditions?: {
    field: string;
    operator: string;
    value: unknown;
  }[];
}

/**
 * Template action configuration - simplified for templates
 */
export interface TemplateActionConfig {
  type: "whatsapp" | "email" | "update_record" | "create_task";
  name: string;
  order: number;
  recipientType?: "client" | "phone" | "variable";
  phoneNumber?: string;
  clientId?: string;
  variablePath?: string;
  message?: string;
  templateId?: string;
  email?: string;
  subject?: string;
  body?: string;
  fromName?: string;
  entityType?: string;
  entityIdType?: "fixed" | "variable";
  entityId?: string;
  entityIdVariablePath?: string;
  updates?: Record<string, unknown>;
  title?: string;
  description?: string;
  assignToType?: "staff" | "owner" | "variable";
  staffId?: string;
  assignToVariablePath?: string;
  dueDateType?: "relative" | "absolute" | "variable";
  relativeDueDate?: string;
  absoluteDueDate?: string;
  dueDateVariablePath?: string;
  priority?: "low" | "normal" | "high";
}

/**
 * Automation template table - stores pre-built automation templates
 * These templates are created by the system and can be applied by users
 * to quickly create automations with pre-filled configurations
 */
export const automationTemplate = pgTable(
  "automation_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Template name
    name: varchar("name", { length: 255 }).notNull(),
    // Template description
    description: text("description"),
    // Category for grouping templates
    category: varchar("category", { length: 100 }).notNull(),
    // Business type key this template is for (beauty, health, fitness, professional, technical)
    businessTypeKey: varchar("business_type_key", { length: 50 }).notNull(),
    // Icon to display in UI
    icon: varchar("icon", { length: 50 }),
    // Whether this template is available for use
    isActive: boolean("is_active").notNull().default(true),
    // Default automation name when applied
    defaultName: varchar("default_name", { length: 255 }),
    // Default automation description when applied
    defaultDescription: text("default_description"),
    // Trigger configuration (JSON)
    triggerConfig: jsonb("trigger_config").$type<TemplateTriggerConfig>(),
    // Actions configuration (JSON array)
    actionConfigs: jsonb("action_configs").$type<TemplateActionConfig[]>(),
    // Usage count - how many times this template has been applied
    usageCount: integer("usage_count").notNull().default(0),
    // Tags for searching
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("automation_template_business_type_key_idx").on(table.businessTypeKey),
    index("automation_template_category_idx").on(table.category),
    index("automation_template_is_active_idx").on(table.isActive),
  ],
);

export type AutomationTemplate = typeof automationTemplate.$inferSelect;
export type NewAutomationTemplate = typeof automationTemplate.$inferInsert;
