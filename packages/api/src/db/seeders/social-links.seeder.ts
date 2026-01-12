import { createSeederContext } from "./helpers";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { createdProfileIds } from "./profiles.seeder";
import { eq, and } from "drizzle-orm";
import { socialLink } from "../schema/social-link";
import { db } from "../index";
import { SEED_USERS } from "./users.seeder";

// Store created social link IDs for reference in other seeders
export const createdSocialLinkIds: Record<string, string> = {};

const SOCIAL_LINK_DATA = [
  // María's social links
  {
    key: "mariaInstagram",
    profileKey: "maria",
    userIndex: 0,
    platform: "instagram" as const,
    url: "https://instagram.com/maria_wellness",
    displayOrder: 1,
  },
  {
    key: "mariaWhatsapp",
    profileKey: "maria",
    userIndex: 0,
    platform: "whatsapp" as const,
    url: "https://wa.me/51987654321",
    displayOrder: 2,
  },
  {
    key: "mariaTiktok",
    profileKey: "maria",
    userIndex: 0,
    platform: "tiktok" as const,
    url: "https://tiktok.com/@maria_wellness",
    displayOrder: 3,
  },
  {
    key: "mariaFacebook",
    profileKey: "maria",
    userIndex: 0,
    platform: "facebook" as const,
    url: "https://facebook.com/mariawellness",
    displayOrder: 4,
  },
];

export async function seedSocialLinks() {
  console.log("🔗 Seeding social links...");

  const socialLinkRepository = new SocialLinkRepository();

  for (const linkData of SOCIAL_LINK_DATA) {
    const { key, profileKey, userIndex, ...data } = linkData;
    const profileId = createdProfileIds[profileKey];
    const userId = SEED_USERS[userIndex].id;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping social link`,
      );
      continue;
    }

    // Check if social link already exists (idempotent)
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

    // Use repository to create social link (preserves business logic)
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
