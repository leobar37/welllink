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
import { client } from "./client";
import { servicePackage } from "./service-package";
import { membership } from "./membership";

/**
 * Package status enum
 */
export enum ClientPackageStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  EXHAUSTED = "exhausted",
  CANCELLED = "cancelled",
}

/**
 * Purchase type enum
 */
export enum PurchaseType {
  PACKAGE = "package",
  MEMBERSHIP = "membership",
}

/**
 * Client Package - tracks purchased packages/memberships with remaining sessions
 * This is the link between a client and a purchased package
 */
export const clientPackage = pgTable(
  "client_package",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    // Type of purchase: package or membership
    purchaseType: varchar("purchase_type", {
      length: 20,
      enum: [PurchaseType.PACKAGE, PurchaseType.MEMBERSHIP],
    }).notNull(),
    // Reference to the package or membership
    packageId: uuid("package_id").references(() => servicePackage.id, {
      onDelete: "cascade",
    }),
    membershipId: uuid("membership_id").references(() => membership.id, {
      onDelete: "cascade",
    }),
    // Number of sessions remaining
    remainingSessions: integer("remaining_sessions").notNull().default(0),
    // Total sessions purchased
    totalSessions: integer("total_sessions").notNull().default(0),
    // Price paid
    pricePaid: decimal("price_paid", { precision: 10, scale: 2 }),
    // Status: active, expired, exhausted, cancelled
    status: varchar("status", {
      length: 20,
      enum: [
        ClientPackageStatus.ACTIVE,
        ClientPackageStatus.EXPIRED,
        ClientPackageStatus.EXHAUSTED,
        ClientPackageStatus.CANCELLED,
      ],
    }).notNull().default(ClientPackageStatus.ACTIVE),
    // When the package was purchased
    purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
    // When the package expires (based on validityDays)
    expiresAt: timestamp("expires_at"),
    // When the membership period started
    currentPeriodStart: timestamp("current_period_start"),
    // When the membership period ends (for renewals)
    currentPeriodEnd: timestamp("current_period_end"),
    // For memberships: is auto-renew enabled
    autoRenew: boolean("auto_renew").default(false),
    // Additional metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_client_package_profile_id").on(table.profileId),
    clientIdIdx: index("idx_client_package_client_id").on(table.clientId),
    packageIdIdx: index("idx_client_package_package_id").on(table.packageId),
    membershipIdIdx: index("idx_client_package_membership_id").on(table.membershipId),
    statusIdx: index("idx_client_package_status").on(table.status),
  }),
);

export type ClientPackage = typeof clientPackage.$inferSelect;
export type NewClientPackage = typeof clientPackage.$inferInsert;
