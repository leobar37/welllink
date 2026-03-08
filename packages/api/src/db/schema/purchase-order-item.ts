import {
  pgTable,
  uuid,
  decimal,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { purchaseOrder } from "./purchase-order";
import { product } from "./product";

/**
 * Purchase Order Item table - line items in a purchase order
 */
export const purchaseOrderItem = pgTable(
  "purchase_order_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Purchase order reference
    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => purchaseOrder.id, { onDelete: "cascade" }),
    // Product reference
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    // Quantity ordered
    quantity: integer("quantity").notNull(),
    // Unit price at time of order
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    // Total for this line item
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    // Quantity received so far (for partial receiving)
    receivedQuantity: integer("received_quantity").notNull().default(0),
    // Notes for this line item
    notes: uuid("notes"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("purchase_order_item_purchase_order_id_idx").on(
      table.purchaseOrderId,
    ),
    index("purchase_order_item_product_id_idx").on(table.productId),
  ],
);

export type PurchaseOrderItem = typeof purchaseOrderItem.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItem.$inferInsert;
