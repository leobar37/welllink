import { z } from "zod";

// Schema para las recomendaciones del cliente (van al PDF)
export const clientRecommendationsSchema = z.object({
  hydration: z.object({
    dailyLiters: z.number(),
    formula: z.string(),
    schedule: z.array(z.string()),
    alerts: z.array(z.string()),
    comparison: z.string(),
  }),
  bmi: z.object({
    current: z.number(),
    category: z.string(),
    healthyRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    currentWeight: z.number(),
    targetWeight: z.number(),
    weightToLose: z.number(),
  }),
  prioritizedConditions: z.array(
    z.object({
      name: z.string(),
      severity: z.enum(["alta", "media", "baja"]),
      category: z.string(),
      relatedTo: z.array(z.string()),
    })
  ),
  diet: z.object({
    avoid: z.array(z.string()),
    recommended: z.array(z.string()),
    supplements: z.array(z.string()),
    mealFrequency: z.string(),
  }),
  exercise: z.object({
    type: z.string(),
    intensity: z.string(),
    frequency: z.string(),
    precautions: z.array(z.string()),
  }),
  wellnessScore: z.object({
    overall: z.number().min(0).max(100),
    byCategory: z.record(z.string(), z.number()),
    trend: z.string(),
  }),
  riskFactors: z.array(
    z.object({
      factor: z.string(),
      action: z.string(),
    })
  ),
  supplementsRoutine: z.object({
    morning: z.array(
      z.object({
        product: z.string(),
        dose: z.string(),
        benefit: z.string(),
      })
    ),
    breakfast: z.array(
      z.object({
        product: z.string(),
        dose: z.string(),
        benefit: z.string(),
      })
    ),
    evening: z
      .array(
        z.object({
          product: z.string(),
          dose: z.string(),
          benefit: z.string(),
        })
      )
      .optional(),
  }),
  summary: z.string(),
});

// Schema para las notas del asesor (privadas)
export const advisorNotesSchema = z.object({
  precautions: z.array(z.string()),
  weeklyPlan: z.object({
    day1: z.string(),
    day2: z.string(),
    day3: z.string(),
    day4: z.string(),
    day5: z.string(),
    day6: z.string(),
    day7: z.string(),
  }),
  conversationTopics: z.array(z.string()),
  realisticGoals: z.array(z.string()),
  alertSigns: z.array(z.string()),
  followUpSchedule: z.object({
    day1: z.string(),
    day3: z.string(),
    day5: z.string(),
    day7: z.string(),
  }),
});

// Schema completo de la respuesta de IA
export const aiResponseSchema = z.object({
  clientRecommendations: clientRecommendationsSchema,
  advisorNotes: advisorNotesSchema,
});

export type ClientRecommendations = z.infer<typeof clientRecommendationsSchema>;
export type AdvisorNotes = z.infer<typeof advisorNotesSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
