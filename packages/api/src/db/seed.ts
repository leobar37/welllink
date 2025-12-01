import { config } from "dotenv";
import { seedUsers } from "./seeders/users.seeder";
import { seedAssets } from "./seeders/assets.seeder";
import { seedProfiles } from "./seeders/profiles.seeder";
import { seedSocialLinks } from "./seeders/social-links.seeder";
import { seedHealthSurveys } from "./seeders/health-surveys.seeder";
import { seedAnalytics } from "./seeders/analytics.seeder";
import { seedProfileCustomizations } from "./seeders/profile-customization.seeder";
import { seedStories } from "./seeders/stories.seeder";

// Load environment variables
config({ path: ".env" });

async function seed() {
  console.log("\n🌱 Starting database seeding...\n");
  console.log("=".repeat(50));
  console.log("\n");

  try {
    // Execute seeders in dependency order
    // 1. Users (no dependencies)
    await seedUsers();

    // 2. Assets (depends on users)
    await seedAssets();

    // 3. Profiles (depends on users and assets)
    await seedProfiles();

    // 4. Social Links (depends on profiles)
    await seedSocialLinks();

    // 5. Profile Customizations (depends on profiles)
    await seedProfileCustomizations();

    // 6. Tu Historia (depends on profiles & assets)
    await seedStories();

    // 7. Health Survey Responses (depends on profiles)
    await seedHealthSurveys();

    // 8. Analytics (depends on profiles and social links)
    await seedAnalytics();

    console.log("\n" + "=".repeat(50));
    console.log("\n🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("  - 3 users created");
    console.log("  - 14 assets created (avatars, covers y slider antes/después)");
    console.log("  - 3 profiles created");
    console.log("  - 11 social links created");
    console.log("  - 2 profile customizations created");
    console.log("  - 2 secciones 'Tu Historia' configuradas");
    console.log("  - 4 historias creadas (3 publicadas)");
    console.log("  - 49 eventos de interacción registrados");
    console.log("  - 5 health survey responses created");
    console.log("  - 85+ profile views created");
    console.log("  - 100+ social clicks created");
    console.log("  - 13 QR downloads created\n");
    console.log("🔐 Login credentials:");
    console.log(
      "  Email: maria.rodriguez@example.com | carlos.mendoza@example.com | ana.silva@example.com",
    );
    console.log("  Password: 182@Alfk3458\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeder
seed();
