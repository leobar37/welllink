import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { medicalService } from "./medical-service";

export const slotStatus = [
  "available",
  "pending_approval",
  "reserved",
  "expired",
  "blocked",
] as const;
export type SlotStatus = (typeof slotStatus)[number];

export const timeSlot = pgTable(
  "time_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => medicalService.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    maxReservations: integer("max_reservations").notNull().default(1),
    currentReservations: integer("current_reservations").notNull().default(0),
    status: varchar("status", { length: 50 })
      .$type<SlotStatus>()
      .notNull()
      .default("available"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    profileIdIdx: index("idx_time_slot_profile_id").on(table.profileId),
    serviceIdIdx: index("idx_time_slot_service_id").on(table.serviceId),
    startTimeIdx: index("idx_time_slot_start_time").on(table.startTime),
    statusIdx: index("idx_time_slot_status").on(table.status),
    expiresIdx: index("idx_time_slot_expires").on(table.expiresAt),
  }),
);

export type TimeSlot = typeof timeSlot.$inferSelect;
export type NewTimeSlot = typeof timeSlot.$inferInsert;
