import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { user } from "./auth";
import { staffRoleEnum } from "./enums";

/**
 * Staff table - stores staff members for a business
 * Each staff member is associated with a profile (business) and optionally with a user account
 */
export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    // Optional link to Better Auth user account
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    role: staffRoleEnum("role").notNull().default("staff"),
    // Profile photo
    avatarId: uuid("avatar_id"),
    // Whether the staff member is active
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
    profileIdIdx: index("idx_staff_profile_id").on(table.profileId),
    userIdIdx: index("idx_staff_user_id").on(table.userId),
    activeIdx: index("idx_staff_active").on(table.isActive),
  }),
);

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
