import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

/**
 * Product category table - categorizes products for organization
 */
export const productCategory = pgTable(
  "product_category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }), // Hex color code
    icon: varchar("icon", { length: 50 }), // Icon identifier
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("product_category_profile_id_idx").on(table.profileId),
    index("product_category_name_idx").on(table.name),
    index("product_category_sort_order_idx").on(table.sortOrder),
  ],
);

export type ProductCategory = typeof productCategory.$inferSelect;
export type NewProductCategory = typeof productCategory.$inferInsert;
