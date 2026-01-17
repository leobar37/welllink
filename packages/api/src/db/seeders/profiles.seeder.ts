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
  const userId = await getTestUserId();

  for (const profileData of PROFILE_DATA) {
    const { key, avatarKey, coverKey, ...data } = profileData;
    const ctx = createSeederContext(userId);

    const existingProfile = await db.query.profile.findFirst({
      where: eq(profile.username, data.username),
    });

    if (existingProfile) {
      console.log(`  ✓ Profile @${data.username} already exists, skipping`);
      createdProfileIds[key] = existingProfile.id;
      continue;
    }

    const avatarId = createdAssetIds[avatarKey];
    const coverImageId = createdAssetIds[coverKey];

    const created = await profileRepository.create(ctx, {
      ...data,
      userId,
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
