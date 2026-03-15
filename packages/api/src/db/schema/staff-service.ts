import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { staff } from "./staff";
import { service } from "./service";

/**
 * Staff-Service junction table - assigns services to staff members
 * A staff member can perform multiple services, and a service can be performed by multiple staff
 */
export const staffService = pgTable(
  "staff_service",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    // Whether this service assignment is active
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    staffIdIdx: index("idx_staff_service_staff_id").on(table.staffId),
    serviceIdIdx: index("idx_staff_service_service_id").on(table.serviceId),
    uniqueStaffService: {
      // Drizzle doesn't support unique constraints this way, handled by DB
      columns: [table.staffId, table.serviceId],
    },
  }),
);

export type StaffService = typeof staffService.$inferSelect;
export type NewStaffService = typeof staffService.$inferInsert;
