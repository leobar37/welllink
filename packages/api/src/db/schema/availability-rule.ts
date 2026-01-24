import {
  pgTable,
  uuid,
  integer,
  time,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const availabilityRule = pgTable(
  "availability_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    slotDuration: integer("slot_duration").notNull().default(30),
    bufferTime: integer("buffer_time").notNull().default(0),
    maxAppointmentsPerSlot: integer("max_appointments_per_slot")
      .notNull()
      .default(1),
    effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
    effectiveTo: timestamp("effective_to"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    profileIdIdx: index("idx_availability_profile_id").on(table.profileId),
    dayIdx: index("idx_availability_day").on(table.dayOfWeek),
    activeIdx: index("idx_availability_active").on(table.isActive),
  }),
);

export type AvailabilityRule = typeof availabilityRule.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRule.$inferInsert;
