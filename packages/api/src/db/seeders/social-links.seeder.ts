import { createSeederContext } from "./helpers";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId, getClinicUserId } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { socialLink } from "../schema/social-link";
import { db } from "../index";

export const createdSocialLinkIds: Record<string, string> = {};

const SOCIAL_LINK_DATA = [
  // María García - Perfil Individual
  {
    key: "mariaInstagram",
    profileKey: "maria",
    platform: "instagram" as const,
    username: "maria_wellness",
    displayOrder: 1,
  },
  {
    key: "mariaWhatsapp",
    profileKey: "maria",
    platform: "whatsapp" as const,
    username: "51987654321",
    displayOrder: 2,
  },
  {
    key: "mariaTiktok",
    profileKey: "maria",
    platform: "tiktok" as const,
    username: "maria_wellness",
    displayOrder: 3,
  },
  {
    key: "mariaFacebook",
    profileKey: "maria",
    platform: "facebook" as const,
    username: "mariawellness",
    displayOrder: 4,
  },
  // Clínica Bienestar - Perfil Organizacional
  {
    key: "clinicInstagram",
    profileKey: "clinic",
    platform: "instagram" as const,
    username: "clinicabienestar",
    displayOrder: 1,
  },
  {
    key: "clinicWhatsapp",
    profileKey: "clinic",
    platform: "whatsapp" as const,
    username: "51999888777",
    displayOrder: 2,
  },
  {
    key: "clinicFacebook",
    profileKey: "clinic",
    platform: "facebook" as const,
    username: "clinicabienestar",
    displayOrder: 3,
  },
  {
    key: "clinicYoutube",
    profileKey: "clinic",
    platform: "youtube" as const,
    username: "@clinicabienestar",
    displayOrder: 4,
  },
];

export async function seedSocialLinks() {
  console.log("🔗 Seeding social links...");

  const socialLinkRepository = new SocialLinkRepository();
  const testUserId = await getTestUserId();
  const clinicUserId = await getClinicUserId();

  for (const linkData of SOCIAL_LINK_DATA) {
    const { key, profileKey, ...data } = linkData;
    const profileId = createdProfileIds[profileKey];

    // Use the correct user ID based on the profile
    // maria profile belongs to testUserId, clinic profile belongs to clinicUserId
    const userId = profileKey === "clinic" ? clinicUserId : testUserId;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping social link`,
      );
      continue;
    }

    const existingLink = await db.query.socialLink.findFirst({
      where: and(
        eq(socialLink.profileId, profileId),
        eq(socialLink.platform, data.platform),
      ),
    });

    if (existingLink) {
      console.log(
        `  ✓ Social link ${data.platform} already exists for profile ${profileKey}, skipping`,
      );
      createdSocialLinkIds[key] = existingLink.id;
      continue;
    }

    const created = await socialLinkRepository.create(ctx, {
      ...data,
      profileId,
    });

    createdSocialLinkIds[key] = created.id;
    console.log(
      `  ✓ Created social link: ${profileKey}/${data.platform} (order: ${data.displayOrder}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Social links seeded successfully\n");
}
