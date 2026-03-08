import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { supplier } from "./supplier";
import { product } from "./product";

/**
 * Supplier-Product junction table
 * Links products to suppliers with supplier-specific pricing and details
 */
export const supplierProduct = pgTable(
  "supplier_product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    // Supplier-specific SKU for this product
    supplierSku: varchar("supplier_sku", { length: 100 }),
    // Cost price from this supplier
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    // Lead time in days
    leadTimeDays: integer("lead_time_days"),
    // Minimum order quantity
    minOrderQty: integer("min_order_qty"),
    // Is this the primary supplier for this product
    isPrimary: boolean("is_primary").notNull().default(false),
    // Additional notes
    notes: varchar("notes", { length: 500 }),
    // Soft delete
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("supplier_product_profile_id_idx").on(table.profileId),
    index("supplier_product_supplier_id_idx").on(table.supplierId),
    index("supplier_product_product_id_idx").on(table.productId),
    index("supplier_product_is_primary_idx").on(table.isPrimary),
    index("supplier_product_is_active_idx").on(table.isActive),
  ],
);

export type SupplierProduct = typeof supplierProduct.$inferSelect;
export type NewSupplierProduct = typeof supplierProduct.$inferInsert;
