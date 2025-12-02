import { z } from "zod";

// Schema para las recomendaciones del cliente (van al PDF)
export const clientRecommendationsSchema = z.object({
  hydration: z.object({
    dailyLiters: z.number().describe("Litros de agua recomendados por día"),
    formula: z
      .string()
      .describe("Fórmula usada para calcular (ej: peso * 35ml)"),
    schedule: z
      .array(z.string())
      .describe("Horario sugerido de hidratación con cantidades"),
    alerts: z
      .array(z.string())
      .describe("Alertas basadas en los síntomas del usuario"),
    comparison: z
      .string()
      .describe("Comparación entre consumo actual y recomendado"),
  }),
  bmi: z.object({
    current: z.number().describe("IMC actual calculado"),
    category: z
      .string()
      .describe("Categoría: Bajo peso, Normal, Sobrepeso, Obesidad"),
    healthyRange: z.object({
      min: z.number().describe("Peso mínimo saludable en kg"),
      max: z.number().describe("Peso máximo saludable en kg"),
    }),
    currentWeight: z.number().describe("Peso actual en kg"),
    targetWeight: z.number().describe("Peso meta sugerido en kg"),
    weightToLose: z.number().describe("Kg a perder/ganar para llegar a la meta"),
  }),
  prioritizedConditions: z
    .array(
      z.object({
        name: z.string().describe("Nombre de la condición"),
        severity: z.enum(["alta", "media", "baja"]).describe("Severidad"),
        category: z
          .string()
          .describe(
            "Categoría: digestivo, cardiovascular, energia, inmune, muscular, hormonal, piel, otros"
          ),
        relatedTo: z
          .array(z.string())
          .describe("Otras condiciones relacionadas"),
      })
    )
    .describe("Condiciones priorizadas por severidad"),
  diet: z.object({
    avoid: z
      .array(z.string())
      .describe("Alimentos a evitar según las condiciones"),
    recommended: z.array(z.string()).describe("Alimentos recomendados"),
    supplements: z
      .array(z.string())
      .describe("Suplementos sugeridos con justificación"),
    mealFrequency: z
      .string()
      .describe("Frecuencia de comidas recomendada"),
  }),
  exercise: z.object({
    type: z.string().describe("Tipo de ejercicio recomendado"),
    intensity: z.string().describe("Intensidad sugerida"),
    frequency: z.string().describe("Frecuencia semanal y duración"),
    precautions: z
      .array(z.string())
      .describe("Precauciones según las condiciones del usuario"),
  }),
  wellnessScore: z.object({
    overall: z
      .number()
      .min(0)
      .max(100)
      .describe("Puntuación general de bienestar 0-100"),
    byCategory: z
      .record(z.string(), z.number())
      .describe("Puntuación por categoría de salud"),
    trend: z.string().describe("Tendencia o comentario sobre el score"),
  }),
  riskFactors: z
    .array(
      z.object({
        factor: z.string().describe("Factor de riesgo identificado"),
        action: z.string().describe("Acción recomendada"),
      })
    )
    .describe("Factores de riesgo basados en historial y condiciones"),
  supplementsRoutine: z.object({
    morning: z
      .array(
        z.object({
          product: z.string().describe("Nombre del producto Herbalife"),
          dose: z.string().describe("Dosis recomendada"),
          benefit: z.string().describe("Beneficio principal para este usuario"),
        })
      )
      .describe("Productos para tomar en ayunas"),
    breakfast: z
      .array(
        z.object({
          product: z.string().describe("Nombre del producto Herbalife"),
          dose: z.string().describe("Dosis recomendada"),
          benefit: z.string().describe("Beneficio principal para este usuario"),
        })
      )
      .describe("Productos para tomar con el desayuno"),
    evening: z
      .array(
        z.object({
          product: z.string().describe("Nombre del producto Herbalife"),
          dose: z.string().describe("Dosis recomendada"),
          benefit: z.string().describe("Beneficio principal para este usuario"),
        })
      )
      .optional()
      .describe("Productos opcionales para la noche"),
  }),
  summary: z
    .string()
    .describe(
      "Resumen ejecutivo de 2-3 oraciones con las prioridades principales"
    ),
});

// Schema para las notas del asesor (privadas)
export const advisorNotesSchema = z.object({
  precautions: z
    .array(z.string())
    .describe(
      "Precauciones específicas con este cliente basadas en sus condiciones"
    ),
  weeklyPlan: z.object({
    day1: z.string().describe("Qué hacer/preguntar el día 1 del reto"),
    day2: z.string().describe("Qué hacer/preguntar el día 2 del reto"),
    day3: z.string().describe("Qué hacer/preguntar el día 3 del reto"),
    day4: z.string().describe("Qué hacer/preguntar el día 4 del reto"),
    day5: z.string().describe("Qué hacer/preguntar el día 5 del reto"),
    day6: z.string().describe("Qué hacer/preguntar el día 6 del reto"),
    day7: z.string().describe("Qué hacer/preguntar el día 7 del reto"),
  }),
  conversationTopics: z
    .array(z.string())
    .describe("Temas de conversación sugeridos basados en la info del usuario"),
  realisticGoals: z
    .array(z.string())
    .describe("Metas realistas para este perfil específico"),
  alertSigns: z
    .array(z.string())
    .describe("Señales de alerta a monitorear y cómo reaccionar"),
  followUpSchedule: z.object({
    day1: z.string().describe("Tipo de contacto para el día 1"),
    day3: z.string().describe("Tipo de contacto para el día 3"),
    day5: z.string().describe("Tipo de contacto para el día 5"),
    day7: z.string().describe("Tipo de contacto para el día 7"),
  }),
});

// Schema completo de la respuesta de IA
export const aiResponseSchema = z.object({
  clientRecommendations: clientRecommendationsSchema,
  advisorNotes: advisorNotesSchema,
});

export type ClientRecommendationsType = z.infer<
  typeof clientRecommendationsSchema
>;
export type AdvisorNotesType = z.infer<typeof advisorNotesSchema>;
export type AIResponseType = z.infer<typeof aiResponseSchema>;
