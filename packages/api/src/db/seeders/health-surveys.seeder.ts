import { createSeederContext } from "./helpers";
import { HealthSurveyRepository } from "../../services/repository/health-survey";
import type { HealthSurveyResponseData } from "../schema/health-survey";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { healthSurveyResponse } from "../schema/health-survey";
import { db } from "../index";

export async function seedHealthSurveys() {
  console.log("📋 Seeding health survey responses...");

  const healthSurveyRepository = new HealthSurveyRepository();
  const userId = await getTestUserId();
  const mariaId = createdProfileIds.maria;

  const surveys = [
    {
      profileId: mariaId,
      visitorName: "Laura Gómez",
      visitorPhone: "+51912345678",
      visitorEmail: "laura.gomez@example.com",
      visitorWhatsapp: "+51912345678",
      referredBy: "Instagram",
      responses: {
        measurements: { weight: 68, height: 165, age: 32 },
        conditions: {
          digestive: ["Hinchazón", "Estreñimiento"],
          cardiovascular: [],
          energy: ["Fatiga crónica", "Dificultad para concentrarse"],
          immune: ["Resfriados frecuentes"],
          muscular: [],
          hormonal: ["Irregularidad menstrual"],
          skin: ["Acné"],
          other: [],
        },
        habits: {
          waterIntake: "1-2 litros/día",
          training: "sometimes",
          nutrition: "regular",
          familyHistory: "Diabetes tipo 2 en familia",
        },
        metadata: { version: "1.0" },
      } as HealthSurveyResponseData,
      whatsappSentAt: new Date("2024-11-25T15:30:00Z"),
    },
    {
      profileId: mariaId,
      visitorName: "Roberto Pérez",
      visitorPhone: null,
      visitorEmail: "roberto.p@example.com",
      visitorWhatsapp: "+51923456789",
      referredBy: "Recomendación de amigo",
      responses: {
        measurements: { weight: 85, height: 178, age: 45 },
        conditions: {
          digestive: [],
          cardiovascular: ["Presión alta"],
          energy: ["Fatiga crónica"],
          immune: [],
          muscular: ["Dolor en articulaciones"],
          hormonal: [],
          skin: [],
          other: ["Sobrepeso"],
        },
        habits: {
          waterIntake: "Menos de 1 litro/día",
          training: "no",
          nutrition: "no",
          familyHistory: "Hipertensión",
        },
        metadata: { version: "1.0" },
      } as HealthSurveyResponseData,
      whatsappSentAt: new Date("2024-11-28T10:00:00Z"),
    },
  ];

  for (const surveyData of surveys) {
    const ctx = createSeederContext(userId);

    const existingSurvey = await db.query.healthSurveyResponse.findFirst({
      where: eq(healthSurveyResponse.visitorName, surveyData.visitorName),
    });

    if (existingSurvey) {
      console.log(
        `  ✓ Survey from ${surveyData.visitorName} already exists, skipping`,
      );
      continue;
    }

    await healthSurveyRepository.create(surveyData);
    console.log(`  ✓ Created survey response from: ${surveyData.visitorName}`);
  }

  console.log("✅ Health surveys seeded successfully\n");
}
