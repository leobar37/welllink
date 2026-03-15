import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { staff } from "./staff";

/**
 * Break time type for availability
 */
export interface StaffBreak {
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
}

/**
 * Staff Availability table - stores work schedules for staff members
 * Each staff member can have multiple availability entries (one per day)
 */
export const staffAvailability = pgTable(
  "staff_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Day of week: 1=Monday, 7=Sunday
    dayOfWeek: integer("day_of_week").notNull(), // 1-7 (ISO-8601)
    // Work start time in "HH:MM" format
    startTime: varchar("start_time", { length: 5 }).notNull(),
    // Work end time in "HH:MM" format
    endTime: varchar("end_time", { length: 5 }).notNull(),
    // Break times during the day
    breaks: jsonb("breaks").$type<StaffBreak[]>().default([]),
    // Whether this day is available (can be used to disable a day without deleting)
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    staffIdIdx: index("idx_staff_availability_staff_id").on(table.staffId),
    dayOfWeekIdx: index("idx_staff_availability_day").on(table.dayOfWeek),
    // Unique constraint: one availability entry per staff per day
  }),
);

export type StaffAvailability = typeof staffAvailability.$inferSelect;
export type NewStaffAvailability = typeof staffAvailability.$inferInsert;
