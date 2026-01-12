import { AnalyticsRepository } from "../../services/repository/analytics";
import { createdProfileIds } from "./profiles.seeder";
import { createdSocialLinkIds } from "./social-links.seeder";

// Generar fechas distribuidas en los últimos 30 días
const generateRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return date;
};

export async function seedAnalytics() {
  console.log("📊 Seeding analytics data...");

  const analyticsRepository = new AnalyticsRepository();

  const mariaId = createdProfileIds.maria;

  if (!mariaId) {
    console.log("  ⚠️  No profiles found, skipping analytics seeding");
    return;
  }

  // Profile Views - María
  console.log("  📈 Seeding profile views...");
  let viewCount = 0;

  // María - 35 views
  for (let i = 0; i < 35; i++) {
    const sources = ["qr", "direct_link", "referral"] as const;
    await analyticsRepository.createProfileView({
      profileId: mariaId,
      source: sources[Math.floor(Math.random() * 3)],
      referrer: Math.random() > 0.5 ? "https://instagram.com" : null,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      viewedAt: generateRandomDate(Math.floor(Math.random() * 30)),
    });
    viewCount++;
  }

  console.log(`  ✓ Created ${viewCount} profile views`);

  // Social Clicks
  console.log("  👆 Seeding social clicks...");
  let clickCount = 0;

  // María's social clicks (Instagram más popular)
  const mariaSocialLinks = [
    { id: createdSocialLinkIds.mariaInstagram, clicks: 28 },
    { id: createdSocialLinkIds.mariaWhatsapp, clicks: 15 },
    { id: createdSocialLinkIds.mariaTiktok, clicks: 10 },
    { id: createdSocialLinkIds.mariaFacebook, clicks: 8 },
  ];

  for (const link of mariaSocialLinks) {
    if (!link.id) {
      console.log(`  ⚠️  Social link ID not found, skipping`);
      continue;
    }
    for (let i = 0; i < link.clicks; i++) {
      await analyticsRepository.createSocialClick({
        socialLinkId: link.id,
      });
      clickCount++;
    }
  }

  console.log(`  ✓ Created ${clickCount} social clicks`);

  // QR Downloads
  console.log("  📥 Seeding QR downloads...");
  const downloads = [
    // María - varios downloads
    {
      profileId: mariaId,
      format: "png" as const,
      downloadedAt: generateRandomDate(25),
    },
    {
      profileId: mariaId,
      format: "svg" as const,
      downloadedAt: generateRandomDate(22),
    },
    {
      profileId: mariaId,
      format: "png" as const,
      downloadedAt: generateRandomDate(18),
    },
    {
      profileId: mariaId,
      format: "png" as const,
      downloadedAt: generateRandomDate(10),
    },
    {
      profileId: mariaId,
      format: "svg" as const,
      downloadedAt: generateRandomDate(5),
    },
  ];

  for (const download of downloads) {
    await analyticsRepository.createQRDownload(download);
  }

  console.log(`  ✓ Created ${downloads.length} QR downloads`);

  console.log("✅ Analytics seeded successfully\n");
}
