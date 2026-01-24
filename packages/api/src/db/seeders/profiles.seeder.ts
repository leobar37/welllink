import { createSeederContext } from "./helpers";
import { ProfileRepository } from "../../services/repository/profile";
import { getTestUserId, getClinicUserId } from "./users.seeder";
import { createdAssetIds } from "./assets.seeder";
import { eq } from "drizzle-orm";
import { profile } from "../schema/profile";
import { db } from "../index";

export const createdProfileIds: Record<string, string> = {};

const PROFILE_DATA = [
  {
    key: "maria",
    username: "maria_wellness",
    displayName: "Dra. María García",
    title: "Médico General - Medicina Familiar",
    bio: "Cuidando la salud de tu familia con atención personalizada y warmth. Medicina preventiva y atención primaria para todas las edades 🩺",
    avatarKey: "mariaAvatar",
    coverKey: "mariaCover",
    whatsappNumber: "+51987654321",
    isDefault: true,
    isPublished: true,
    onboardingStep: 5,
    onboardingCompletedAt: new Date("2024-11-15T10:30:00Z"),
    featuresConfig: {
      healthSurvey: {
        enabled: true,
        buttonText: "Evalúate gratis",
      },
      tuHistoria: {
        enabled: true,
        buttonText: "Mi historia",
      },
    },
  },
  {
    key: "clinic",
    username: "clinic_bienestar",
    displayName: "Clínica Bienestar",
    title: "Centro de Salud Integral",
    bio: "Brindamos atención médica integral para toda la familia. Contamos con especialistas en medicina general, nutrición y bienestar.",
    avatarKey: "clinicLogo",
    coverKey: "clinicCover",
    whatsappNumber: "+51999888777",
    isDefault: true,
    isPublished: true,
    onboardingStep: 5,
    onboardingCompletedAt: new Date("2024-11-15T10:30:00Z"),
    isOrganization: true,
    clinicName: "Clínica Bienestar S.A.",
    clinicAddress: "Av. Principal 1234, Lima, Perú",
    clinicPhone: "+51 1 2345678",
    clinicEmail: "contacto@clinicabienestar.com",
    clinicWebsite: "https://www.clinicabienestar.com",
    clinicRuc: "20123456789",
    featuresConfig: {
      healthSurvey: {
        enabled: true,
        buttonText: "Agenda tu evaluación",
      },
      appointments: {
        enabled: true,
      },
    },
  },
];

export async function seedProfiles() {
  console.log("👤 Seeding profiles...");

  const profileRepository = new ProfileRepository();
  const testUserId = await getTestUserId();
  const clinicUserId = await getClinicUserId();

  // Cleanup existing profiles for both users
  console.log(`  🧹 Cleaning up existing profiles...`);
  await db.delete(profile).where(eq(profile.userId, testUserId));
  await db.delete(profile).where(eq(profile.userId, clinicUserId));
  console.log(`  ✓ Removed old profiles`);

  for (const profileData of PROFILE_DATA) {
    const { key, avatarKey, coverKey, ...data } = profileData;

    // Determine which user this profile belongs to
    const userId = key === "clinic" ? clinicUserId : testUserId;
    const ctx = createSeederContext(userId);

    const avatarId = createdAssetIds[avatarKey];
    const coverImageId = createdAssetIds[coverKey];

    // userId is added internally by the repository
    const created = await profileRepository.create(ctx, {
      ...data,
      avatarId,
      coverImageId,
    });

    createdProfileIds[key] = created.id;
    console.log(
      `  ✓ Created profile: @${data.username} (${data.isPublished ? "published" : "draft"}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Profiles seeded successfully\n");
}
