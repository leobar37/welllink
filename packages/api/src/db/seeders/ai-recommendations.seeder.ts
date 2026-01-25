import { createSeederContext } from "./helpers";
import { AIRecommendationRepository } from "../../services/repository/ai-recommendation";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
// health-survey: REMOVED - legacy wellness feature
import { aiRecommendation } from "../schema/ai-recommendation";
import { db } from "../index";
import type {
  ClientRecommendations,
  AdvisorNotes,
} from "../schema/ai-recommendation";

export const createdAIRecommendationIds: Record<string, string> = {};

// AI Recommendations - now independent of health surveys
const AI_RECOMMENDATION_DATA = [
  {
    key: "recommendation_general_1",
    profileKey: "maria",
    recommendations: {
      hydration: {
        dailyLiters: 2.5,
        formula: "35ml por kg de peso corporal",
        schedule: [
          "8:00 - 500ml",
          "10:30 - 400ml",
          "13:00 - 400ml",
          "15:30 - 400ml",
          "18:00 - 400ml",
          "20:00 - 300ml",
        ],
        alerts: [
          "Aumentar consumo en días de ejercicio",
          "Reducir agua después de las 8 PM para evitar interrupciones del sueño",
        ],
        comparison:
          "Tu consumo actual de 1-2 litros está 20-47% por debajo del óptimo",
      },
      bmi: {
        current: 25,
        category: "Sobrepeso grado 1",
        healthyRange: { min: 18.5, max: 24.9 },
        currentWeight: 68,
        targetWeight: 58,
        weightToLose: 10,
      },
      prioritizedConditions: [
        {
          name: "Hinchazón digestiva",
          severity: "media" as const,
          category: "Digestivo",
          relatedTo: [
            "Alimentación rica en procesados",
            "Bajo consumo de fibra",
          ],
        },
        {
          name: "Fatiga crónica",
          severity: "media" as const,
          category: "Energía",
          relatedTo: ["Deficiencia de hierro", "Calidad del sueño"],
        },
      ],
      diet: {
        avoid: [
          "Refrescos y bebidas azucaradas",
          "Comida frita",
          "Exceso de cafeína después de las 2 PM",
          "Lácteos enteros",
        ],
        recommended: [
          "Alimentos ricos en hierro: espinacas, carnes rojas, legumbres",
          "Frutas con vitamina C para absorción de hierro",
          "Alimentos probióticos: yogurt natural, kéfir",
          "Granos integrales",
        ],
        supplements: [
          "Vitamina D: 1000 UI diarias",
          "Hierro: solo si análisis lo confirma",
          "Omega-3: 1000mg diarios",
        ],
        mealFrequency:
          "5 comidas al día (desayuno, media mañana, almuerzo, merienda, cena)",
      },
      exercise: {
        type: "Entrenamiento funcional de baja intensidad",
        intensity: "Moderada (60-70% FC máxima)",
        frequency: "4 veces por semana, 30-45 minutos",
        precautions: [
          "Evitar ejercicio intenso en ayunas",
          "Mantener hidratación durante el entrenamiento",
          "No exceder 60 minutos en sesiones iniciales",
        ],
      },
      wellnessScore: {
        overall: 58,
        byCategory: {
          nutrition: 55,
          hydration: 45,
          exercise: 50,
          sleep: 65,
          stress: 70,
        },
        trend: "mejorando",
      },
      riskFactors: [
        {
          factor: "Historial familiar de diabetes",
          action: "Monitoreo trimestral de glucosa en ayunas",
        },
        {
          factor: "Bajo consumo de fibra",
          action: "Incrementar gradualmente a 25-30g diarios",
        },
      ],
      supplementsRoutine: {
        morning: [
          {
            product: "Vitamina D3",
            dose: "1000 UI",
            benefit: "Función inmune y salud ósea",
          },
          {
            product: "Omega-3",
            dose: "500mg",
            benefit: "Función cognitiva y anti-inflamatorio",
          },
        ],
        breakfast: [
          {
            product: "Hierro (si aplica)",
            dose: "Según prescripción",
            benefit: "Prevención de anemia",
          },
        ],
        evening: [
          {
            product: "Magnesio",
            dose: "200mg",
            benefit: "Calidad del sueño y relajación muscular",
          },
        ],
      },
      summary:
        "Recomendación general de bienestar. La prioridad es establecer una hidratación adecuada y mejorar la calidad de la dieta. Se recomienda un plan gradual de 3 meses con foco en hábitos sostenibles.",
    } as ClientRecommendations,
    advisorNotes: {
      precautions: [
        "Considerar análisis de sangre para verificar niveles de hierro",
        "Enfoque en inmunidad si el paciente reporta gripes frecuentes",
      ],
      weeklyPlan: {
        day1: "Evaluación de hidratación, objetivo de 2L, eliminar bebidas azucaradas",
        day2: "Introducir rutina de desayuno con proteína en la primera hora",
        day3: "Aumentar fibra: agregar 1 porción de verduras a cada comida",
        day4: "Revisar progreso de hidratación, ajustar si es necesario",
        day5: "Introducir ejercicio ligero: 20 min caminando después de almuerzo",
        day6: "Preparación de comidas para la semana",
        day7: "Día de descanso - revisar progreso y establecer metas",
      },
      conversationTopics: [
        "Técnicas de manejo del estrés",
        "Mejoras en higiene del sueño",
        "Estrategias para comer en familia",
      ],
      realisticGoals: [
        "Perder 3-4 kg en el primer mes",
        "Aumentar intake de agua a 2L/día en 2 semanas",
        "Establecer hábito consistente de desayuno",
        "Caminar 10,000 pasos diarios",
      ],
      alertSigns: [
        "Empeoramiento de síntomas digestivos",
        "Fatiga severa que limite actividades diarias",
        "Cambios de humor o indicadores de depresión",
      ],
      followUpSchedule: {
        day1: "Check-in: Cómo fue el primer día de hidratación?",
        day3: "Revisión de progreso: Desafíos con el desayuno?",
        day5: "Feedback de ejercicio",
        day7: "Revisión semanal completa",
      },
    } as AdvisorNotes,
  },
];

export async function seedAIRecommendations() {
  console.log("🤖 Seeding AI recommendations...");

  const aiRecommendationRepository = new AIRecommendationRepository();
  const userId = await getTestUserId();

  // health-survey dependency removed - now seeding independently
  for (const recData of AI_RECOMMENDATION_DATA) {
    const { key, profileKey, ...data } = recData;
    const profileId = createdProfileIds[profileKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping recommendation`,
      );
      continue;
    }

    // Check if recommendation already exists for this profile
    const existingRec = await db.query.aiRecommendation.findFirst({
      where: eq(aiRecommendation.profileId, profileId),
    });

    if (existingRec) {
      console.log(
        `  ✓ Recommendation for profile ${profileKey} already exists, skipping`,
      );
      createdAIRecommendationIds[key] = existingRec.id;
      continue;
    }

    const created = await aiRecommendationRepository.create({
      ...data,
      profileId,
      // surveyResponseId: REMOVED - column deleted
      aiModel: "gpt-4o",
      aiVersion: "2024-11-01",
      processingTimeMs: 3500,
    });

    createdAIRecommendationIds[key] = created.id;
    console.log(
      `  ✓ Created AI recommendation for profile: ${profileKey} - ID: ${created.id}`,
    );
  }

  console.log("✅ AI recommendations seeded successfully\n");
}
