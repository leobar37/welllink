import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { timeSlot } from "./time-slot";
import { medicalService } from "./medical-service";

export const requestStatus = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;
export const urgencyLevel = ["low", "normal", "high", "urgent"] as const;
export const contactMethod = ["whatsapp", "phone", "email"] as const;

export type RequestStatus = (typeof requestStatus)[number];
export type UrgencyLevel = (typeof urgencyLevel)[number];
export type ContactMethod = (typeof contactMethod)[number];

export const reservationRequest = pgTable(
  "reservation_request",
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

    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }),
    patientAge: integer("patient_age"),
    patientGender: varchar("patient_gender", { length: 20 }),

    chiefComplaint: text("chief_complaint"),
    symptoms: text("symptoms"),
    medicalHistory: text("medical_history"),
    currentMedications: text("current_medications"),
    allergies: text("allergies"),
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
    requestedTime: timestamp("requested_time").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

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
    slotIdIdx: index("idx_request_slot_id").on(table.slotId),
    statusIdx: index("idx_request_status").on(table.status),
    expiresIdx: index("idx_request_expires").on(table.expiresAt),
    phoneIdx: index("idx_request_patient_phone").on(table.patientPhone),
  }),
);

export type ReservationRequest = typeof reservationRequest.$inferSelect;
export type NewReservationRequest = typeof reservationRequest.$inferInsert;
