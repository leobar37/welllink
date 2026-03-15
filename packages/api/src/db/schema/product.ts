import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { productCategory } from "./product-category";
import { supplier } from "./supplier";
import { productUnitEnum } from "./enums";

/**
 * Product table - main product inventory data
 */
export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    // SKU - unique identifier per profile
    sku: varchar("sku", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Pricing
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    cost: decimal("cost", { precision: 10, scale: 2 }), // Cost per unit
    // Unit of measurement
    unit: productUnitEnum("unit").notNull().default("piece"),
    // Minimum stock threshold for low stock alerts
    minStock: integer("min_stock").default(0),
    // Category reference
    categoryId: uuid("category_id").references(() => productCategory.id, {
      onDelete: "set null",
    }),
    // Primary supplier reference
    supplierId: uuid("supplier_id").references(() => supplier.id, {
      onDelete: "set null",
    }),
    // Barcode for scanning
    barcode: varchar("barcode", { length: 100 }),
    // Expiration tracking
    hasExpiration: boolean("has_expiration").notNull().default(false),
    expirationDays: integer("expiration_days"), // Days until expiration from purchase
    // Additional info
    brand: varchar("brand", { length: 100 }),
    notes: text("notes"),
    // Soft delete
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    // Audit fields
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("product_profile_id_idx").on(table.profileId),
    index("product_sku_idx").on(table.sku),
    index("product_name_idx").on(table.name),
    index("product_category_id_idx").on(table.categoryId),
    index("product_supplier_id_idx").on(table.supplierId),
    index("product_barcode_idx").on(table.barcode),
    index("product_is_active_idx").on(table.isActive),
    // Unique SKU per profile
    index("product_profile_sku_unique_idx").on(table.profileId, table.sku),
  ],
);

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
