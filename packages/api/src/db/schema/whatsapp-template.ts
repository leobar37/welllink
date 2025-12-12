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
import { whatsappConfig } from "./whatsapp-config";

export enum TemplateStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  DISABLED = "disabled",
}

export enum TemplateCategory {
  MARKETING = "marketing",
  UTILITY = "utility",
  AUTHENTICATION = "authentication",
}

export interface TemplateVariable {
  type: "text" | "currency" | "date_time" | "image" | "video" | "document";
  name: string;
  example?: string;
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  buttons?: Array<{
    type: "URL" | "QUICK_REPLY" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phoneNumber?: string;
    example?: string;
  }>;
}

export const whatsappTemplate = pgTable(
  "whatsappTemplate",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    category: text("category", {
      enum: [TemplateCategory.MARKETING, TemplateCategory.UTILITY, TemplateCategory.AUTHENTICATION]
    }).notNull(),
    language: varchar("language", { length: 10 }).notNull().default("es"),
    status: text("status", {
      enum: [TemplateStatus.DRAFT, TemplateStatus.PENDING, TemplateStatus.APPROVED, TemplateStatus.REJECTED, TemplateStatus.DISABLED]
    }).notNull().default(TemplateStatus.DRAFT),
    components: jsonb("components")
      .$type<TemplateComponent[]>()
      .notNull()
      .default([]),
    variables: jsonb("variables")
      .$type<TemplateVariable[]>()
      .notNull()
      .default([]),
    waTemplateId: varchar("wa_template_id", { length: 100 }), // WhatsApp template ID after approval
    rejectionReason: text("rejection_reason"),
    isActive: boolean("is_active").notNull().default(true),
    usageCount: text("usage_count").notNull().default("0"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("whatsapp_template_config_id_idx").on(table.configId),
    index("whatsapp_template_name_idx").on(table.name),
    index("whatsapp_template_status_idx").on(table.status),
    index("whatsapp_template_category_idx").on(table.category),
    index("whatsapp_template_active_idx").on(table.isActive),
  ],
);

export type WhatsAppTemplate = typeof whatsappTemplate.$inferSelect;
export type NewWhatsAppTemplate = typeof whatsappTemplate.$inferInsert;