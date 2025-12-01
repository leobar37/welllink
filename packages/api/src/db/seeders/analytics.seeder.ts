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
  const carlosId = createdProfileIds.carlos;
  const anaId = createdProfileIds.ana;

  // Profile Views - María (más vistas porque está publicada)
  console.log("  📈 Seeding profile views...");
  let viewCount = 0;

  // María - 45 views
  for (let i = 0; i < 45; i++) {
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

  // Carlos - 32 views
  for (let i = 0; i < 32; i++) {
    const sources = ["qr", "direct_link", "referral"] as const;
    await analyticsRepository.createProfileView({
      profileId: carlosId,
      source: sources[Math.floor(Math.random() * 3)],
      referrer: Math.random() > 0.6 ? "https://tiktok.com" : null,
      userAgent: "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36",
      viewedAt: generateRandomDate(Math.floor(Math.random() * 30)),
    });
    viewCount++;
  }

  // Ana - 8 views (pocas porque no está publicada)
  for (let i = 0; i < 8; i++) {
    await analyticsRepository.createProfileView({
      profileId: anaId,
      source: "direct_link",
      referrer: null,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
      viewedAt: generateRandomDate(Math.floor(Math.random() * 15)),
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
    for (let i = 0; i < link.clicks; i++) {
      await analyticsRepository.createSocialClick({
        socialLinkId: link.id,
      });
      clickCount++;
    }
  }

  // Carlos's social clicks (YouTube y WhatsApp populares)
  const carlosSocialLinks = [
    { id: createdSocialLinkIds.carlosInstagram, clicks: 18 },
    { id: createdSocialLinkIds.carlosYoutube, clicks: 22 },
    { id: createdSocialLinkIds.carlosWhatsapp, clicks: 20 },
    { id: createdSocialLinkIds.carlosTiktok, clicks: 12 },
    { id: createdSocialLinkIds.carlosFacebook, clicks: 10 },
  ];

  for (const link of carlosSocialLinks) {
    for (let i = 0; i < link.clicks; i++) {
      await analyticsRepository.createSocialClick({
        socialLinkId: link.id,
      });
      clickCount++;
    }
  }

  // Ana's social clicks (pocos clicks)
  const anaSocialLinks = [
    { id: createdSocialLinkIds.anaInstagram, clicks: 5 },
    { id: createdSocialLinkIds.anaWhatsapp, clicks: 3 },
  ];

  for (const link of anaSocialLinks) {
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

    // Carlos - algunos downloads
    {
      profileId: carlosId,
      format: "png" as const,
      downloadedAt: generateRandomDate(20),
    },
    {
      profileId: carlosId,
      format: "png" as const,
      downloadedAt: generateRandomDate(12),
    },
    {
      profileId: carlosId,
      format: "svg" as const,
      downloadedAt: generateRandomDate(7),
    },

    // Ana - solo 1 download de prueba
    {
      profileId: anaId,
      format: "png" as const,
      downloadedAt: generateRandomDate(3),
    },
  ];

  for (const download of downloads) {
    await analyticsRepository.createQRDownload(download);
  }

  console.log(`  ✓ Created ${downloads.length} QR downloads`);

  console.log("✅ Analytics seeded successfully\n");
}
