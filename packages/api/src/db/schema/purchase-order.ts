import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { supplier } from "./supplier";
import { purchaseOrderStatusEnum } from "./enums";

/**
 * Purchase Order table - tracks orders to suppliers
 */
export const purchaseOrder = pgTable(
  "purchase_order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    // Supplier reference
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "restrict" }),
    // Status: draft -> sent -> partial -> received OR cancelled
    status: purchaseOrderStatusEnum("status").notNull().default("draft"),
    // Order reference number (optional, can be auto-generated)
    orderNumber: varchar("order_number", { length: 50 }),
    // Expected delivery date
    expectedDate: timestamp("expected_date"),
    // Total amount
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    // Tax amount
    tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
    // Notes/comments
    notes: text("notes"),
    // Sent date (when status changed to sent)
    sentAt: timestamp("sent_at"),
    // Received date (when status changed to received)
    receivedAt: timestamp("received_at"),
    // Cancellation reason
    cancelledReason: text("cancelled_reason"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("purchase_order_profile_id_idx").on(table.profileId),
    index("purchase_order_supplier_id_idx").on(table.supplierId),
    index("purchase_order_status_idx").on(table.status),
    index("purchase_order_order_number_idx").on(table.orderNumber),
    index("purchase_order_expected_date_idx").on(table.expectedDate),
    // Unique order number per profile
    index("purchase_order_profile_order_number_unique_idx").on(
      table.profileId,
      table.orderNumber,
    ),
  ],
);

export type PurchaseOrder = typeof purchaseOrder.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrder.$inferInsert;
