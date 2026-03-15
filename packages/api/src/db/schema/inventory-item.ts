import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  decimal,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { product } from "./product";

/**
 * Inventory item table - tracks stock levels per product and location
 */
export const inventoryItem = pgTable(
  "inventory_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    // Location/warehouse name
    location: varchar("location", { length: 100 }).notNull().default("default"),
    // Current stock quantity
    quantity: integer("quantity").notNull().default(0),
    // Reserved quantity (e.g., for pending orders)
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    // Available quantity = quantity - reservedQuantity
    // Track averages for reporting
    averageCost: decimal("average_cost", { precision: 10, scale: 2 }),
    lastRestockedAt: timestamp("last_restocked_at"),
    // Soft delete - allow archiving locations
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("inventory_item_profile_id_idx").on(table.profileId),
    index("inventory_item_product_id_idx").on(table.productId),
    index("inventory_item_location_idx").on(table.location),
    // Unique product + location per profile
    index("inventory_item_product_location_unique_idx").on(
      table.profileId,
      table.productId,
      table.location
    ),
  ],
);

export type InventoryItem = typeof inventoryItem.$inferSelect;
export type NewInventoryItem = typeof inventoryItem.$inferInsert;
