import { Elysia } from "elysia";
import { seedUsers } from "../../db/seeders/users.seeder";
import { seedAssets } from "../../db/seeders/assets.seeder";
import { seedProfiles } from "../../db/seeders/profiles.seeder";
import { seedSocialLinks } from "../../db/seeders/social-links.seeder";
import { seedHealthSurveys } from "../../db/seeders/health-surveys.seeder";
import { seedAnalytics } from "../../db/seeders/analytics.seeder";

export const testRoutes = new Elysia({ prefix: "test" })
  .post("/reset-db", async () => {
    console.log("🔄 Test DB reset requested");
    return {
      success: true,
      message: "Database reset endpoint - use /api/test/seed to seed data",
    };
  })
  .post("/seed", async () => {
    console.log("🌱 Starting database seeding for E2E tests...");

    try {
      await seedUsers();
      await seedAssets();
      await seedProfiles();
      await seedSocialLinks();
      await seedHealthSurveys();
      await seedAnalytics();

      console.log("✅ All seed data inserted successfully");
      return {
        success: true,
        message: "Database seeded successfully",
        testUser: {
          email: "test@wellness.com",
          password: "test123456",
        },
        seededProfile: {
          username: "maria_wellness",
          displayName: "María Test",
          isPublished: true,
        },
      };
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during seeding",
      };
    }
  })
  .post("/cleanup", async () => {
    console.log("🧹 Test cleanup requested");
    return { success: true, message: "Cleanup endpoint placeholder" };
  })
  .get("/status", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      endpoints: [
        "/api/test/reset-db",
        "/api/test/seed",
        "/api/test/cleanup",
        "/api/test/status",
      ],
    };
  });
