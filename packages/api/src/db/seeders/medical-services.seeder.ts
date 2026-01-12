import { createSeederContext } from "./helpers";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { createdProfileIds } from "./profiles.seeder";
import { SEED_USERS } from "./users.seeder";
import { eq } from "drizzle-orm";
import { medicalService } from "../schema/medical-service";
import { db } from "../index";

export const createdMedicalServiceIds: Record<string, string> = {};

const MEDICAL_SERVICE_DATA = [
  {
    key: "consultation",
    profileKey: "maria",
    userIndex: 0,
    name: "Consulta de Nutrición Inicial",
    description: "Evaluación completa de hábitos alimenticios, medidas corporales y análisis de objetivos. Incluye plan nutricional personalizado.",
    duration: 60,
    price: "80.00",
    category: "Nutrición",
    requirements: "Traer análisis de sangre recientes (si dispone)",
    isActive: true,
  },
  {
    key: "followUp",
    profileKey: "maria",
    userIndex: 0,
    name: "Sesión de Seguimiento",
    description: "Revisión de avances, ajustes al plan nutricional y resolución de dudas.",
    duration: 30,
    price: "45.00",
    category: "Nutrición",
    requirements: null,
    isActive: true,
  },
  {
    key: "wellnessPlan",
    profileKey: "maria",
    userIndex: 0,
    name: "Plan de Bienestar Integral (3 meses)",
    description: "Programa completo que incluye evaluación inicial, 4 sesiones de seguimiento, plan de alimentación y rutina de ejercicios.",
    duration: 90,
    price: "250.00",
    category: "Programa",
    requirements: "Compromiso de 3 meses",
    isActive: true,
  },
  {
    key: "groupWorkshop",
    profileKey: "maria",
    userIndex: 0,
    name: "Taller: Alimentación Consciente",
    description: "Taller grupal sobre alimentación consciente, batch cooking y planificación de comidas.",
    duration: 120,
    price: "35.00",
    category: "Taller",
    requirements: null,
    isActive: true,
  },
];

export async function seedMedicalServices() {
  console.log("💊 Seeding medical services...");

  const medicalServiceRepository = new MedicalServiceRepository();

  for (const serviceData of MEDICAL_SERVICE_DATA) {
    const { key, profileKey, userIndex, ...data } = serviceData;
    const profileId = createdProfileIds[profileKey];
    const userId = SEED_USERS[userIndex].id;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping medical service`,
      );
      continue;
    }

    // Check if service already exists (idempotent)
    const existingService = await db.query.medicalService.findFirst({
      where: eq(medicalService.name, data.name),
    });

    if (existingService) {
      console.log(
        `  ✓ Medical service "${data.name}" already exists, skipping`,
      );
      createdMedicalServiceIds[key] = existingService.id;
      continue;
    }

    // Use repository to create medical service (preserves business logic)
    const created = await medicalServiceRepository.create({
      ...data,
      profileId,
    });

    createdMedicalServiceIds[key] = created.id;
    console.log(
      `  ✓ Created medical service: ${data.name} (${data.category}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Medical services seeded successfully\n");
}
