import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// Features configuration type
export interface FeaturesConfig {
  healthSurvey?: {
    enabled: boolean;
    buttonText: string;
  };
  whatsappCta?: {
    enabled: boolean;
    buttonText: string;
  };
}
import { user } from "./auth";
import { asset } from "./asset";

export const profile = pgTable(
  "profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    title: varchar("title", { length: 100 }),
    bio: varchar("bio", { length: 160 }),
    avatarId: uuid("avatar_id").references(() => asset.id, {
      onDelete: "set null",
    }),
    coverImageId: uuid("cover_image_id").references(() => asset.id, {
      onDelete: "set null",
    }),
    whatsappNumber: varchar("whatsapp_number", { length: 20 }),
    featuresConfig: jsonb("features_config")
      .$type<FeaturesConfig>()
      .default({}),
    isDefault: boolean("is_default").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(false),
    onboardingStep: integer("onboarding_step").notNull().default(0),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("profile_user_id_idx").on(table.userId),
    index("profile_username_idx").on(table.username),
  ],
);

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
