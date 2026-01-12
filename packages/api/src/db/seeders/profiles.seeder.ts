import { createSeederContext } from "./helpers";
import { ProfileRepository } from "../../services/repository/profile";
import { SEED_USERS } from "./users.seeder";
import { createdAssetIds } from "./assets.seeder";
import { eq } from "drizzle-orm";
import { profile } from "../schema/profile";
import { db } from "../index";

// Store created profile IDs for reference in other seeders
export const createdProfileIds: Record<string, string> = {};

const PROFILE_DATA = [
  {
    key: "maria",
    userId: SEED_USERS[0].id,
    username: "maria_wellness",
    displayName: "María Test",
    title: "Coach de Bienestar y Nutrición",
    bio: "Ayudo a personas a encontrar su mejor versión a través de hábitos saludables y nutrición consciente 🌱",
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

  for (const profileData of PROFILE_DATA) {
    const { key, userId, avatarKey, coverKey, ...data } = profileData;
    const ctx = createSeederContext(userId);

    // Check if profile already exists (idempotent)
    const existingProfile = await db.query.profile.findFirst({
      where: eq(profile.username, data.username),
    });

    if (existingProfile) {
      console.log(`  ✓ Profile @${data.username} already exists, skipping`);
      createdProfileIds[key] = existingProfile.id;
      continue;
    }

    // Get asset IDs from the createdAssetIds map
    const avatarId = createdAssetIds[avatarKey];
    const coverImageId = createdAssetIds[coverKey];

    // Use repository to create profile (preserves business logic)
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
