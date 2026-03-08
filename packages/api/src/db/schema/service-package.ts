import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

/**
 * Service Package - a bundled set of services that can be purchased
 * Example: "Hair Package" includes haircut + blow dry + styling at discounted price
 */
export const servicePackage = pgTable(
  "service_package",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Price for the entire package
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    // Number of sessions included in the package
    totalSessions: integer("total_sessions").notNull().default(1),
    // Discount percentage from individual services
    discountPercent: integer("discount_percent"),
    // Services included in this package (array of service IDs)
    services: jsonb("services").$type<string[]>(),
    // Valid for X days from purchase date
    validityDays: integer("validity_days"),
    // Whether the package is active
    isActive: boolean("is_active").notNull().default(true),
    // Additional metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_service_package_profile_id").on(table.profileId),
    activeIdx: index("idx_service_package_active").on(table.isActive),
  }),
);

export type ServicePackage = typeof servicePackage.$inferSelect;
export type NewServicePackage = typeof servicePackage.$inferInsert;
