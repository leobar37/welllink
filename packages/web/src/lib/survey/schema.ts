import { z } from "zod"

// Step 1: Personal Data
export const personalDataSchema = z.object({
  visitorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  visitorWhatsapp: z.string().optional(),
  referredBy: z.string().optional(),
})

// Step 2: Measurements
export const measurementsSchema = z.object({
  weight: z.number().min(20, "El peso mínimo es 20 kg").max(300, "El peso máximo es 300 kg"),
  height: z.number().min(50, "La estatura mínima es 50 cm").max(250, "La estatura máxima es 250 cm"),
  age: z.number().min(1, "La edad mínima es 1 año").max(120, "La edad máxima es 120 años"),
})

// Condition array schema (reusable for all categories)
const conditionArraySchema = z.array(z.string()).default([])

// Steps 3-10: Health Conditions by Category
export const conditionsSchema = z.object({
  digestive: conditionArraySchema,
  cardiovascular: conditionArraySchema,
  energy: conditionArraySchema,
  immune: conditionArraySchema,
  muscular: conditionArraySchema,
  hormonal: conditionArraySchema,
  skin: conditionArraySchema,
  other: conditionArraySchema,
})

// Step 11: Habits
export const habitsSchema = z.object({
  waterIntake: z.string().min(1, "Indica cuánta agua tomas al día"),
  training: z.enum(["yes", "no", "sometimes"], {
    required_error: "Selecciona una opción",
  }),
  nutrition: z.enum(["yes", "no", "regular"], {
    required_error: "Selecciona una opción",
  }),
  familyHistory: z.string().optional(),
})

// Complete survey schema for submission
export const fullSurveySchema = z.object({
  personalData: personalDataSchema,
  measurements: measurementsSchema,
  conditions: conditionsSchema,
  habits: habitsSchema,
  metadata: z.object({
    version: z.string().default("1.0.0"),
    completedAt: z.string().optional(),
  }),
})

// Types
export type PersonalDataForm = z.infer<typeof personalDataSchema>
export type MeasurementsForm = z.infer<typeof measurementsSchema>
export type ConditionsForm = z.infer<typeof conditionsSchema>
export type HabitsForm = z.infer<typeof habitsSchema>
export type HealthSurveyFormData = z.infer<typeof fullSurveySchema>

// Category type
export type ConditionCategory = keyof ConditionsForm
