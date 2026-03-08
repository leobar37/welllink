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
 * Billing period enum for memberships
 */
export enum BillingPeriod {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

/**
 * Membership - recurring subscription with benefits
 * Example: "Gold Member" - $99/month includes 4 services + 10% discount
 */
export const membership = pgTable(
  "membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Price per billing period
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    // Billing period
    billingPeriod: varchar("billing_period", {
      length: 20,
      enum: [BillingPeriod.WEEKLY, BillingPeriod.BIWEEKLY, BillingPeriod.MONTHLY, BillingPeriod.QUARTERLY, BillingPeriod.YEARLY],
    }).notNull().default(BillingPeriod.MONTHLY),
    // Benefits included in this membership (JSON array of strings)
    benefits: jsonb("benefits").$type<string[]>(),
    // Number of free/included services per period
    includedSessions: integer("included_sessions"),
    // Discount percent on additional services
    discountPercent: integer("discount_percent"),
    // Whether members can book unlimited sessions within their tier
    unlimitedSessions: boolean("unlimited_sessions").default(false),
    // Whether the membership is active
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
    profileIdIdx: index("idx_membership_profile_id").on(table.profileId),
    activeIdx: index("idx_membership_active").on(table.isActive),
  }),
);

export type Membership = typeof membership.$inferSelect;
export type NewMembership = typeof membership.$inferInsert;
