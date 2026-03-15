import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * Business type table - stores global business type configurations
 * Used to categorize profiles by industry type (beauty, health, fitness, professional, technical)
 */
export const businessType = pgTable(
  "business_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(), // Display name (e.g., "Belleza", "Salud")
    key: varchar("key", { length: 50 }).notNull().unique(), // Unique key (e.g., "beauty", "health")
    description: text("description"), // Optional description
    icon: varchar("icon", { length: 50 }), // Icon identifier for UI
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("business_type_key_idx").on(table.key),
    index("business_type_name_idx").on(table.name),
    index("business_type_is_active_idx").on(table.isActive),
  ],
);

export type BusinessType = typeof businessType.$inferSelect;
export type NewBusinessType = typeof businessType.$inferInsert;
