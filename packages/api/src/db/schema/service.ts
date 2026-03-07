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
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { asset } from "./asset";

export const service = pgTable(
  "service",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    imageAssetId: uuid("image_asset_id").references(() => asset.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    duration: integer("duration").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    category: varchar("category", { length: 100 }),
    requirements: text("requirements"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    profileIdIdx: index("idx_service_profile_id").on(table.profileId),
    categoryIdx: index("idx_service_category").on(table.category),
    activeIdx: index("idx_service_active").on(table.isActive),
  }),
);

export type Service = typeof service.$inferSelect;
export type NewService = typeof service.$inferInsert;
