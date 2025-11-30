import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const profileCustomization = pgTable("profile_customization", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profile.id, { onDelete: "cascade" }),
  themeId: varchar("theme_id", { length: 50 }),
  primaryColor: varchar("primary_color", { length: 7 }),
  backgroundColor: varchar("background_color", { length: 7 }),
  textColor: varchar("text_color", { length: 7 }),
  fontFamily: varchar("font_family", { length: 50 }),
  buttonStyle: varchar("button_style", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ProfileCustomization = typeof profileCustomization.$inferSelect;
export type NewProfileCustomization = typeof profileCustomization.$inferInsert;
