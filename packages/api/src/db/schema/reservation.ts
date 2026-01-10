import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { timeSlot } from "./time-slot";
import { medicalService } from "./medical-service";
import { reservationRequest } from "./reservation-request";

export const reservationStatus = [
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;
export const paymentStatus = ["pending", "paid", "cancelled"] as const;

export type ReservationStatus = (typeof reservationStatus)[number];
export type PaymentStatus = (typeof paymentStatus)[number];

export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => timeSlot.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => medicalService.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").references(() => reservationRequest.id, {
      onDelete: "set null",
    }),

    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }),

    status: varchar("status", { length: 50 })
      .$type<ReservationStatus>()
      .notNull()
      .default("confirmed"),
    source: varchar("source", { length: 50 }).default("whatsapp"),
    notes: text("notes"),

    reminder24hSent: boolean("reminder_24h_sent").default(false),
    reminder2hSent: boolean("reminder_2h_sent").default(false),
    reminder24hScheduled: boolean("reminder_24h_scheduled").default(false),
    reminder2hScheduled: boolean("reminder_2h_scheduled").default(false),

    completedAt: timestamp("completed_at"),
    noShow: boolean("no_show").default(false),

    priceAtBooking: decimal("price_at_booking", { precision: 10, scale: 2 }),
    paymentStatus: varchar("payment_status", { length: 50 })
      .$type<PaymentStatus>()
      .default("pending"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    cancelledAt: timestamp("cancelled_at"),
  },
  (table) => ({
    profileIdIdx: index("idx_reservation_profile_id").on(table.profileId),
    slotIdIdx: index("idx_reservation_slot_id").on(table.slotId),
    statusIdx: index("idx_reservation_status").on(table.status),
    phoneIdx: index("idx_reservation_patient_phone").on(table.patientPhone),
    createdIdx: index("idx_reservation_created").on(table.createdAt),
  }),
);

export type Reservation = typeof reservation.$inferSelect;
export type NewReservation = typeof reservation.$inferInsert;
