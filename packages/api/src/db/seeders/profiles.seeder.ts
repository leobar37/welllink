import { createSeederContext } from "./helpers";
import { ProfileRepository } from "../../services/repository/profile";
import { getTestUserId } from "./users.seeder";
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
];

export async function seedProfiles() {
  console.log("👤 Seeding profiles...");

  const profileRepository = new ProfileRepository();
  const userId = await getTestUserId();

  // CLEANUP: Remove existing profiles for this user to avoid duplicates
  console.log(`  🧹 Cleaning up existing profiles for user...`);
  await db
    .delete(profile)
    .where(eq(profile.userId, userId));
  console.log(`  ✓ Removed old profiles for user`);

  for (const profileData of PROFILE_DATA) {
    const { key, avatarKey, coverKey, ...data } = profileData;
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
