import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { product } from "./product";

/**
 * Low stock alert sent tracking table
 * Prevents sending duplicate low stock alerts for the same product
 */
export const lowStockAlertSent = pgTable(
  "low_stock_alert_sent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    // Stock level when alert was sent (to detect changes)
    stockAtAlert: integer("stock_at_alert"),
    // When the alert was sent
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("low_stock_alert_sent_profile_id_idx").on(table.profileId),
    index("low_stock_alert_sent_product_id_idx").on(table.productId),
    // Unique constraint: one alert per product per profile
    index("low_stock_alert_sent_profile_product_unique_idx").on(
      table.profileId,
      table.productId
    ),
  ],
);

export type LowStockAlertSent = typeof lowStockAlertSent.$inferSelect;
export type NewLowStockAlertSent = typeof lowStockAlertSent.$inferInsert;
