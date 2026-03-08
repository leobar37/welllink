import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { service } from "./service";
import { product } from "./product";

/**
 * Service-Product junction table
 * Links services to the products they consume with quantity_required
 * Used for inventory tracking - when a service is performed, 
 * the associated products are consumed from inventory
 */
export const serviceProduct = pgTable(
  "service_product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    // Quantity of product required/consumed per service instance
    quantityRequired: integer("quantity_required").notNull().default(1),
    // Is this product required for the service or optional
    isRequired: boolean("is_required").notNull().default(true),
    // Notes about this product-service relationship
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
    index("service_product_profile_id_idx").on(table.profileId),
    index("service_product_service_id_idx").on(table.serviceId),
    index("service_product_product_id_idx").on(table.productId),
    index("service_product_is_active_idx").on(table.isActive),
    // Unique constraint: one product-service association per service
    index("service_product_service_product_unique_idx").on(table.serviceId, table.productId),
  ],
);

export type ServiceProduct = typeof serviceProduct.$inferSelect;
export type NewServiceProduct = typeof serviceProduct.$inferInsert;
