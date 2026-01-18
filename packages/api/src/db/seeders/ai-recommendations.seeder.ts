import { createSeederContext } from "./helpers";
import { AIRecommendationRepository } from "../../services/repository/ai-recommendation";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { healthSurveyResponse } from "../schema/health-survey";
import { aiRecommendation } from "../schema/ai-recommendation";
import { db } from "../index";
import type {
  ClientRecommendations,
  AdvisorNotes,
} from "../schema/ai-recommendation";

export const createdAIRecommendationIds: Record<string, string> = {};

const AI_RECOMMENDATION_DATA = [
  {
    key: "recommendation_laura",
    profileKey: "maria",
    surveyVisitorName: "Laura Gómez",
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
        {
          name: "Dificultad para concentrarse",
          severity: "baja" as const,
          category: "Cognitivo",
          relatedTo: ["Hidratación insuficiente", "Irregularidad en comidas"],
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
        "Laura presenta un cuadro de overweight grado 1 con síntomas digestivos y fatiga. La prioridad es establecer una hidratación adecuada y mejorar la calidad de la dieta. Se recomienda un plan gradual de 3 meses con foco en hábitos sostenibles.",
    } as ClientRecommendations,
    advisorNotes: {
      precautions: [
        "Laura mentioned irregular menstrual cycles - recommend tracking with calendar and consider PCOS screening if persists",
        "Fatiga could be related to iron deficiency - verify recent blood work before supplementing",
        "Patient reports frequent colds - immunity focused approach needed",
      ],
      weeklyPlan: {
        day1: "Hydration assessment, introduce 2L goal, eliminate sugary drinks completely",
        day2: "Introduce breakfast routine with protein (eggs, yogurt) within 1 hour of waking",
        day3: "Fiber increase: add 1 serving of vegetables to each meal",
        day4: "Review hydration progress, adjust schedule if needed",
        day5: "Introduce light exercise: 20 min walking after lunch",
        day6: "Meal prep session for next week (focus on protein sources)",
        day7: "Rest day - review progress, set goals for next week",
      },
      conversationTopics: [
        "Stress management techniques that fit her schedule",
        "Sleep hygiene improvements",
        "Social eating strategies for family gatherings",
        "Mindful eating practices",
      ],
      realisticGoals: [
        "Lose 3-4 kg in first month (sustainable rate)",
        "Increase water intake to 2L/day within 2 weeks",
        "Establish consistent breakfast habit",
        "Walk 10,000 steps daily by end of month",
      ],
      alertSigns: [
        "Worsening of digestive symptoms",
        "Severe fatigue limiting daily activities",
        "Mood changes or depression indicators",
        "Missed periods for 3+ consecutive cycles",
      ],
      followUpSchedule: {
        day1: "Check-in: How did the first day of hydration go?",
        day3: "Progress review: Any challenges with breakfast?",
        day5: "Exercise introduction feedback",
        day7: "Full weekly review and adjustments",
      },
    } as AdvisorNotes,
  },
  {
    key: "recommendation_roberto",
    profileKey: "maria",
    surveyVisitorName: "Roberto Pérez",
    recommendations: {
      hydration: {
        dailyLiters: 3,
        formula: "35ml por kg de peso corporal",
        schedule: [
          "7:00 - 600ml",
          "10:00 - 500ml",
          "13:00 - 500ml",
          "16:00 - 500ml",
          "19:00 - 500ml",
          "21:00 - 400ml",
        ],
        alerts: [
          "Aumentar a 3.5L en días de ejercicio",
          "Evitar líquidos después de las 9 PM",
        ],
        comparison:
          "Su consumo actual de menos de 1 litro está 66% por debajo del mínimo recomendado",
      },
      bmi: {
        current: 26.8,
        category: "Sobrepeso grado 1",
        healthyRange: { min: 18.5, max: 24.9 },
        currentWeight: 85,
        targetWeight: 75,
        weightToLose: 10,
      },
      prioritizedConditions: [
        {
          name: "Presión arterial elevada",
          severity: "alta" as const,
          category: "Cardiovascular",
          relatedTo: ["Sobrepeso", "Alto consumo de sal", "Sedentarismo"],
        },
        {
          name: "Dolor articular",
          severity: "media" as const,
          category: "Muscular",
          relatedTo: ["Sobrepeso", "Falta de ejercicio"],
        },
        {
          name: "Fatiga",
          severity: "baja" as const,
          category: "Energía",
          relatedTo: ["Sedentarismo", "Calidad del sueño"],
        },
      ],
      diet: {
        avoid: [
          "Sal de mesa y alimentos procesados",
          "Carnes rojas grasosas",
          "Alcohol",
          "Bebidas energizantes",
        ],
        recommended: [
          "Alimentos ricos en potasio: plátano, espinacas, aguacate",
          "Pescados grasos (salmón, sardinas) 2-3 veces por semana",
          "Frutas y verduras coloridas",
          "Legumbres como fuente de proteína vegetal",
        ],
        supplements: [
          "Omega-3: 2000mg diarios (cardioprotector)",
          "Magnesio: 400mg para presión arterial",
          "CoQ10: 100mg para salud cardíaca",
        ],
        mealFrequency: "3 comidas principales + 2 snacks saludables",
      },
      exercise: {
        type: "Natación y ejercicios en agua",
        intensity: "Moderada (50-60% FC máxima inicial)",
        frequency: "3 veces por semana, 30-45 minutos",
        precautions: [
          "Comenzar con caminata si no tiene acceso a piscina",
          "Evitar ejercicio extenuante hasta controlar presión",
          "Monitorear presión antes y después del ejercicio",
          "No contener la respiración durante el esfuerzo (Valsalva)",
        ],
      },
      wellnessScore: {
        overall: 42,
        byCategory: {
          nutrition: 35,
          hydration: 25,
          exercise: 20,
          sleep: 60,
          stress: 55,
        },
        trend: "estable",
      },
      riskFactors: [
        {
          factor: "Hipertensión familiar",
          action: "Control de presión semanal, registro en 앱",
        },
        {
          factor: "Sedentarismo prolongado",
          action: "Movimiento cada 1-2 horas,desk stretches",
        },
        {
          factor: "Alto riesgo cardiovascular",
          action: "Perfil lipídico completo en 3 meses",
        },
      ],
      supplementsRoutine: {
        morning: [
          {
            product: "Omega-3 EPA/DHA",
            dose: "1000mg",
            benefit: "Reducción de triglicéridos y presión arterial",
          },
          {
            product: "Magnesio citrato",
            dose: "200mg",
            benefit: "Relajación vascular y muscular",
          },
        ],
        breakfast: [
          {
            product: "CoQ10",
            dose: "100mg",
            benefit: "Salud cardíaca y energía celular",
          },
        ],
        evening: [
          {
            product: "Omega-3",
            dose: "1000mg",
            benefit: "Efecto anti-inflamatorio nocturno",
          },
        ],
      },
      summary:
        "Roberto presenta hipertensión estadio 1 combinada con sobrepeso moderado. La intervención debe enfocarse en reducción de sodio, aumento de actividad física gradual (evitando esfuerzo isométrico), y pérdida de peso controlada. Se recomienda coordinación con su médico tratante.",
    } as ClientRecommendations,
    advisorNotes: {
      precautions: [
        "Roberto has diagnosed hypertension - ALWAYS check blood pressure before exercise",
        "He reports joint pain - aquatic exercise is ideal, but walking is acceptable alternative",
        "Family history of hypertension is significant - genetic predisposition requires lifestyle management",
        "He does not exercise at all - start very gradually, focus on consistency over intensity",
      ],
      weeklyPlan: {
        day1: "Medical clearance verification, introduce DASH diet basics, sodium reduction goal: <2g/day",
        day2: "First exercise: 15 min walk, blood pressure monitoring protocol",
        day3: "Meal prep: prepare low-sodium options for the week, sodium-free seasoning alternatives",
        day4: "Exercise: 20 min walk or light swimming, BP check",
        day5: "Review food diary, identify hidden sodium sources",
        day6: "Exercise: 25 min activity of choice, stress management introduction (deep breathing)",
        day7: "Rest day, weekly reflection, BP log review",
      },
      conversationTopics: [
        "Family history and its implications",
        "Practical strategies for eating out with hypertension",
        "Stress management techniques (hypertension connection)",
        "The importance of medication adherence alongside lifestyle changes",
      ],
      realisticGoals: [
        "Reduce sodium intake to <2g/day within 2 weeks",
        "Lose 2-3 kg in first month",
        "Walk 20 minutes daily 5 days/week",
        "Improve sleep quality to 7+ hours",
      ],
      alertSigns: [
        "Blood pressure consistently above 160/100",
        "Chest pain or shortness of breath during exercise",
        "Severe headaches or vision changes",
        "Dizziness or fainting",
      ],
      followUpSchedule: {
        day1: "Initial consult: medical history, set expectations",
        day3: "Check-in: How was the first low-sodium day?",
        day5: "Exercise feedback, BP log review",
        day7: "Full weekly review with weight check",
      },
    } as AdvisorNotes,
  },
];

export async function seedAIRecommendations() {
  console.log("🤖 Seeding AI recommendations...");

  const aiRecommendationRepository = new AIRecommendationRepository();
  const userId = await getTestUserId();
  const mariaId = createdProfileIds.maria;

  // Get survey response IDs first
  const surveys = await db.query.healthSurveyResponse.findMany({
    where: eq(healthSurveyResponse.profileId, mariaId),
  });

  const surveyIdMap: Record<string, string> = {};
  for (const survey of surveys) {
    surveyIdMap[survey.visitorName] = survey.id;
  }

  for (const recData of AI_RECOMMENDATION_DATA) {
    const { key, profileKey, surveyVisitorName, ...data } = recData;
    const profileId = createdProfileIds[profileKey];
    const surveyId = surveyIdMap[surveyVisitorName];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping recommendation`,
      );
      continue;
    }

    if (!surveyId) {
      console.log(
        `  ⚠️  Survey from ${surveyVisitorName} not found, skipping recommendation`,
      );
      continue;
    }

    const existingRec = await db.query.aiRecommendation.findFirst({
      where: eq(aiRecommendation.surveyResponseId, surveyId),
    });

    if (existingRec) {
      console.log(
        `  ✓ Recommendation for ${surveyVisitorName} already exists, skipping`,
      );
      createdAIRecommendationIds[key] = existingRec.id;
      continue;
    }

    const created = await aiRecommendationRepository.create({
      ...data,
      profileId,
      surveyResponseId: surveyId,
      aiModel: "gpt-4o",
      aiVersion: "2024-11-01",
      processingTimeMs: 3500,
    });

    createdAIRecommendationIds[key] = created.id;
    console.log(
      `  ✓ Created AI recommendation for: ${surveyVisitorName} - ID: ${created.id}`,
    );
  }

  console.log("✅ AI recommendations seeded successfully\n");
}
