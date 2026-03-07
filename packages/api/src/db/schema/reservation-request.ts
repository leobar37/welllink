import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { service } from "./service";

export const requestStatus = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "counter_proposed",
] as const;
export const urgencyLevel = ["low", "normal", "high", "urgent"] as const;
export const contactMethod = ["whatsapp", "phone", "email"] as const;

export type RequestStatus = (typeof requestStatus)[number];
export type UrgencyLevel = (typeof urgencyLevel)[number];
export type ContactMethod = (typeof contactMethod)[number];

// Metadata structure for reservation requests
export interface ReservationRequestMetadata {
  urgencyLevel?: UrgencyLevel;
  isNewCustomer?: boolean;
  notes?: string;
}

export const reservationRequest = pgTable(
  "reservation_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),

    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerAge: integer("customer_age"),
    customerGender: varchar("customer_gender", { length: 20 }),

    reason: text("reason"),
    urgencyLevel: varchar("urgency_level", { length: 20 })
      .$type<UrgencyLevel>()
      .default("normal"),
    preferredContactMethod: varchar("preferred_contact_method", { length: 20 })
      .$type<ContactMethod>()
      .default("whatsapp"),

    status: varchar("status", { length: 50 })
      .$type<RequestStatus>()
      .notNull()
      .default("pending"),

    // Request expiration for pending requests
    expiresAt: timestamp("expires_at").notNull(),

    // New fields for direct request model (no slots)
    preferredAtUtc: timestamp("preferred_at_utc").notNull(),
    requestedTimezone: varchar("requested_timezone", { length: 64 })
      .notNull()
      .default("America/Lima"),
    metadata: jsonb("metadata").$type<ReservationRequestMetadata>(),

    // Reschedule proposal fields
    proposedAtUtc: timestamp("proposed_at_utc"),
    proposalReason: text("proposal_reason"),
    proposalExpiresAt: timestamp("proposal_expires_at"),

    approvedBy: uuid("approved_by").references(() => profile.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_request_profile_id").on(table.profileId),
    statusIdx: index("idx_request_status").on(table.status),
    expiresIdx: index("idx_request_expires").on(table.expiresAt),
    phoneIdx: index("idx_request_customer_phone").on(table.customerPhone),
    preferredAtUtcIdx: index("idx_request_preferred_at_utc").on(
      table.preferredAtUtc,
    ),
  }),
);

export type ReservationRequest = typeof reservationRequest.$inferSelect;
export type NewReservationRequest = typeof reservationRequest.$inferInsert;
