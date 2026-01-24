import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { healthSurveyResponse } from "./health-survey";

export enum ClientLabel {
  CONSUMIDOR = "consumidor",
  PROSPECTO = "prospecto",
  AFILIADO = "afiliado",
}

export const client = pgTable(
  "client",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    healthSurveyId: uuid("health_survey_id").references(
      () => healthSurveyResponse.id,
      { onDelete: "set null" },
    ),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    label: text("label", {
      enum: [ClientLabel.CONSUMIDOR, ClientLabel.PROSPECTO, ClientLabel.AFILIADO],
    })
      .notNull()
      .default(ClientLabel.CONSUMIDOR),
    notes: text("notes"),
    lastContactAt: timestamp("last_contact_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("client_profile_id_idx").on(table.profileId),
    index("client_phone_idx").on(table.phone),
    index("client_label_idx").on(table.label),
    index("client_health_survey_id_idx").on(table.healthSurveyId),
    index("client_last_contact_at_idx").on(table.lastContactAt),
  ],
);

export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;
