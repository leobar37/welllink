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
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const medicalService = pgTable(
  "medical_service",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    duration: integer("duration").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    category: varchar("category", { length: 100 }),
    requirements: text("requirements"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_medical_service_profile_id").on(table.profileId),
    categoryIdx: index("idx_medical_service_category").on(table.category),
    activeIdx: index("idx_medical_service_active").on(table.isActive),
  }),
);

export type MedicalService = typeof medicalService.$inferSelect;
export type NewMedicalService = typeof medicalService.$inferInsert;
