import { createSeederContext } from "./helpers";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { socialLink } from "../schema/social-link";
import { db } from "../index";

export const createdSocialLinkIds: Record<string, string> = {};

const SOCIAL_LINK_DATA = [
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
];

export async function seedSocialLinks() {
  console.log("🔗 Seeding social links...");

  const socialLinkRepository = new SocialLinkRepository();
  const userId = await getTestUserId();

  for (const linkData of SOCIAL_LINK_DATA) {
    const { key, profileKey, ...data } = linkData;
    const profileId = createdProfileIds[profileKey];
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
        `  ✓ Social link ${data.platform} already exists for profile, skipping`,
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
      `  ✓ Created social link: ${data.platform} (order: ${data.displayOrder}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Social links seeded successfully\n");
}
