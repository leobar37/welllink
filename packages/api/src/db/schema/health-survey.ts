import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const healthSurveyResponse = pgTable(
  "health_survey_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    visitorName: varchar("visitor_name", { length: 200 }).notNull(),
    visitorPhone: varchar("visitor_phone", { length: 20 }),
    visitorEmail: varchar("visitor_email", { length: 255 }),
    visitorWhatsapp: varchar("visitor_whatsapp", { length: 20 }),
    referredBy: varchar("referred_by", { length: 200 }),
    responses: jsonb("responses").notNull(),
    whatsappSentAt: timestamp("whatsapp_sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("health_survey_profile_id_idx").on(table.profileId),
    index("health_survey_created_at_idx").on(table.profileId, table.createdAt),
    index("health_survey_visitor_phone_idx").on(table.visitorPhone),
    index("health_survey_visitor_whatsapp_idx").on(table.visitorWhatsapp),
  ]
);

export type HealthSurveyResponse = typeof healthSurveyResponse.$inferSelect;
export type NewHealthSurveyResponse = typeof healthSurveyResponse.$inferInsert;

export interface HealthSurveyResponseData {
  measurements: {
    weight: number;
    height: number;
    age: number;
  };
  conditions: {
    digestive: string[];
    cardiovascular: string[];
    energy: string[];
    immune: string[];
    muscular: string[];
    hormonal: string[];
    skin: string[];
    other: string[];
  };
  habits: {
    waterIntake: string;
    training: "yes" | "no" | "sometimes";
    nutrition: "yes" | "no" | "regular";
    familyHistory?: string;
  };
  metadata: {
    version: string;
  };
}
