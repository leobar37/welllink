import { createSeederContext } from "./helpers";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { medicalService } from "../schema/medical-service";
import { db } from "../index";

export const createdMedicalServiceIds: Record<string, string> = {};

const MEDICAL_SERVICE_DATA = [
  {
    key: "consultation",
    profileKey: "maria",
    name: "Consulta de Nutrición Inicial",
    description:
      "Evaluación completa de hábitos alimenticios, medidas corporales y análisis de objetivos. Incluye plan nutricional personalizado.",
    duration: 60,
    price: "80.00",
    category: "Nutrición",
    requirements: "Traer análisis de sangre recientes (si dispone)",
    isActive: true,
  },
  {
    key: "followUp",
    profileKey: "maria",
    name: "Sesión de Seguimiento",
    description:
      "Revisión de avances, ajustes al plan nutricional y resolución de dudas.",
    duration: 30,
    price: "45.00",
    category: "Nutrición",
    requirements: null,
    isActive: true,
  },
  {
    key: "wellnessPlan",
    profileKey: "maria",
    name: "Plan de Bienestar Integral (3 meses)",
    description:
      "Programa completo que incluye evaluación inicial, 4 sesiones de seguimiento, plan de alimentación y rutina de ejercicios.",
    duration: 90,
    price: "250.00",
    category: "Programa",
    requirements: "Compromiso de 3 meses",
    isActive: true,
  },
  {
    key: "groupWorkshop",
    profileKey: "maria",
    name: "Taller: Alimentación Consciente",
    description:
      "Taller grupal sobre alimentación consciente, batch cooking y planificación de comidas.",
    duration: 120,
    price: "35.00",
    category: "Taller",
    requirements: null,
    isActive: true,
  },
  {
    key: "clinicConsultation",
    profileKey: "clinic",
    name: "Consulta Medicina General",
    description: "Evaluación médica integral, diagnóstico y tratamiento de enfermedades comunes.",
    duration: 30,
    price: "50.00",
    category: "Medicina General",
    requirements: null,
    isActive: true,
  },
  {
    key: "clinicPediatrics",
    profileKey: "clinic",
    name: "Control Pediátrico",
    description: "Evaluación del crecimiento y desarrollo para niños y adolescentes.",
    duration: 45,
    price: "60.00",
    category: "Pediatría",
    requirements: "Traer carnet de vacunación",
    isActive: true,
  },
  {
    key: "clinicNutrition",
    profileKey: "clinic",
    name: "Asesoría Nutricional",
    description: "Plan de alimentación saludable adaptado a tus necesidades específicas.",
    duration: 60,
    price: "45.00",
    category: "Nutrición",
    requirements: null,
    isActive: true,
  },
];

export async function seedMedicalServices() {
  console.log("💊 Seeding medical services...");

  const medicalServiceRepository = new MedicalServiceRepository();
  const userId = await getTestUserId();

  // CLEANUP: Get profile IDs for this user and clean up their medical services
  console.log(`  🧹 Cleaning up existing medical services...`);
  const userProfileIds = Object.values(createdProfileIds);
  for (const profileId of userProfileIds) {
    await db
      .delete(medicalService)
      .where(eq(medicalService.profileId, profileId));
  }
  console.log(`  ✓ Removed ${userProfileIds.length} profile(s) worth of medical services`);

  for (const serviceData of MEDICAL_SERVICE_DATA) {
    const { key, profileKey, ...data } = serviceData;
    const profileId = createdProfileIds[profileKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping medical service`,
      );
      continue;
    }

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
