import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { healthSurveyResponse } from "./health-survey";

export const aiRecommendation = pgTable(
  "ai_recommendation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    surveyResponseId: uuid("survey_response_id")
      .notNull()
      .references(() => healthSurveyResponse.id, { onDelete: "cascade" }),
    recommendations: jsonb("recommendations").notNull(),
    advisorNotes: jsonb("advisor_notes").notNull(),
    aiModel: varchar("ai_model", { length: 50 }).notNull(),
    aiVersion: varchar("ai_version", { length: 50 }),
    processingTimeMs: integer("processing_time_ms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_recommendation_profile_id_idx").on(table.profileId),
    index("ai_recommendation_survey_id_idx").on(table.surveyResponseId),
    index("ai_recommendation_created_at_idx").on(
      table.profileId,
      table.createdAt
    ),
  ]
);

export type AIRecommendation = typeof aiRecommendation.$inferSelect;
export type NewAIRecommendation = typeof aiRecommendation.$inferInsert;

// Tipos para el contenido JSON de recomendaciones (para el cliente)
export interface ClientRecommendations {
  hydration: {
    dailyLiters: number;
    formula: string;
    schedule: string[];
    alerts: string[];
    comparison: string;
  };
  bmi: {
    current: number;
    category: string;
    healthyRange: { min: number; max: number };
    currentWeight: number;
    targetWeight: number;
    weightToLose: number;
  };
  prioritizedConditions: Array<{
    name: string;
    severity: "alta" | "media" | "baja";
    category: string;
    relatedTo: string[];
  }>;
  diet: {
    avoid: string[];
    recommended: string[];
    supplements: string[];
    mealFrequency: string;
  };
  exercise: {
    type: string;
    intensity: string;
    frequency: string;
    precautions: string[];
  };
  wellnessScore: {
    overall: number;
    byCategory: Record<string, number>;
    trend: string;
  };
  riskFactors: Array<{
    factor: string;
    action: string;
  }>;
  supplementsRoutine: {
    morning: Array<{
      product: string;
      dose: string;
      benefit: string;
    }>;
    breakfast: Array<{
      product: string;
      dose: string;
      benefit: string;
    }>;
    evening?: Array<{
      product: string;
      dose: string;
      benefit: string;
    }>;
  };
  summary: string;
}

// Tipos para las notas del asesor (privado)
export interface AdvisorNotes {
  precautions: string[];
  weeklyPlan: {
    day1: string;
    day2: string;
    day3: string;
    day4: string;
    day5: string;
    day6: string;
    day7: string;
  };
  conversationTopics: string[];
  realisticGoals: string[];
  alertSigns: string[];
  followUpSchedule: {
    day1: string;
    day3: string;
    day5: string;
    day7: string;
  };
}
