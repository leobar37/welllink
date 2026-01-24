import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { paymentMethodTypeEnum } from "./enums";

export const paymentMethod = pgTable(
  "payment_method",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    type: paymentMethodTypeEnum("type").notNull(),
    instructions: text("instructions"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_payment_method_profile_id").on(table.profileId),
    index("idx_payment_method_type").on(table.type),
    index("idx_payment_method_active").on(table.isActive),
  ],
);

export type PaymentMethod = typeof paymentMethod.$inferSelect;
export type NewPaymentMethod = typeof paymentMethod.$inferInsert;
