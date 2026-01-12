import { createSeederContext } from "./helpers";
import { HealthSurveyRepository } from "../../services/repository/health-survey";
import type { HealthSurveyResponseData } from "../schema/health-survey";
import { createdProfileIds } from "./profiles.seeder";
import { SEED_USERS } from "./users.seeder";
import { eq } from "drizzle-orm";
import { healthSurveyResponse } from "../schema/health-survey";
import { db } from "../index";

export async function seedHealthSurveys() {
  console.log("📋 Seeding health survey responses...");

  const healthSurveyRepository = new HealthSurveyRepository();

  const mariaId = createdProfileIds.maria;

  const surveys = [
    // Survey 1 - Para María (perfil de nutrición)
    {
      userIndex: 0,
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
    // Survey 2 - Para María
    {
      userIndex: 0,
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
    const { userIndex, ...data } = surveyData;
    const userId = SEED_USERS[userIndex].id;
    const ctx = createSeederContext(userId);

    // Check if survey already exists by checking visitor name + profile (idempotent)
    const existingSurvey = await db.query.healthSurveyResponse.findFirst({
      where: eq(healthSurveyResponse.visitorName, data.visitorName),
    });

    if (existingSurvey) {
      console.log(
        `  ✓ Survey from ${data.visitorName} already exists, skipping`,
      );
      continue;
    }

    // Use repository to create survey (preserves business logic)
    await healthSurveyRepository.create(data);
    console.log(`  ✓ Created survey response from: ${data.visitorName}`);
  }

  console.log("✅ Health surveys seeded successfully\n");
}
