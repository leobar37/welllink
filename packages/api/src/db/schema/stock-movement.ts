import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { product } from "./product";
import { user } from "./auth";
import { inventoryItem } from "./inventory-item";
import { stockMovementReasonEnum } from "./enums";

/**
 * Stock movement table - tracks all inventory changes for audit trail
 */
export const stockMovement = pgTable(
  "stock_movement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    // Reference to inventory item (for multi-location)
    inventoryItemId: uuid("inventory_item_id").references(
      () => inventoryItem.id,
      { onDelete: "cascade" }
    ),
    // User who made the change
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    // Movement type
    reason: stockMovementReasonEnum("reason").notNull(),
    // Quantity change (positive = increase, negative = decrease)
    quantity: integer("quantity").notNull(),
    // Stock before and after
    quantityBefore: integer("quantity_before").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    // Location (for reference)
    location: varchar("location", { length: 100 }).notNull().default("default"),
    // Optional reference (e.g., purchase order ID, reservation ID)
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: uuid("reference_id"),
    // Notes
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("stock_movement_profile_id_idx").on(table.profileId),
    index("stock_movement_product_id_idx").on(table.productId),
    index("stock_movement_inventory_item_id_idx").on(table.inventoryItemId),
    index("stock_movement_user_id_idx").on(table.userId),
    index("stock_movement_reason_idx").on(table.reason),
    index("stock_movement_created_at_idx").on(table.createdAt),
    // For fetching movements by reference
    index("stock_movement_reference_idx").on(
      table.referenceType,
      table.referenceId
    ),
  ],
);

export type StockMovement = typeof stockMovement.$inferSelect;
export type NewStockMovement = typeof stockMovement.$inferInsert;
