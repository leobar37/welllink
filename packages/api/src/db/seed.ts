import { config } from "dotenv";
import postgres from "postgres";
import { seedUsers } from "./seeders/users.seeder";
import { seedAssets } from "./seeders/assets.seeder";
import { seedProfiles } from "./seeders/profiles.seeder";
import { seedSocialLinks } from "./seeders/social-links.seeder";
import { seedHealthSurveys } from "./seeders/health-surveys.seeder";
import { seedAnalytics } from "./seeders/analytics.seeder";
import { seedProfileCustomizations } from "./seeders/profile-customization.seeder";
import { seedMedicalServices } from "./seeders/medical-services.seeder";
import { seedTimeSlots } from "./seeders/time-slots.seeder";
import { seedClients } from "./seeders/clients.seeder";
import { seedReservations } from "./seeders/reservations.seeder";
import { seedCampaigns } from "./seeders/campaigns.seeder";
import { db } from "./index";
import { user, profile, account, session, asset } from "./schema";
import { eq, sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: ".env" });

// Cleanup function to remove seed data before seeding
async function cleanupSeedData() {
  console.log("🧹 Cleaning up existing seed data...\n");

  // Fix qr_download table - add missing source column
  try {
    await db.execute(sql`ALTER TABLE qr_download ADD COLUMN IF NOT EXISTS source text DEFAULT 'qr'`);
    console.log("  ✓ Added source column to qr_download table");
  } catch (error: any) {
    // Column might exist or table doesn't exist yet
  }

  // First drop profile table completely and recreate it
  try {
    await db.execute(sql`DROP TABLE IF EXISTS profile CASCADE`);
    console.log("  ✓ Dropped profile table");
    
    // Recreate profile table with all required columns
    await db.execute(sql`
      CREATE TABLE profile (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        username varchar(50) NOT NULL UNIQUE,
        display_name varchar(100) NOT NULL,
        title varchar(100),
        bio varchar(160),
        avatar_id uuid REFERENCES asset(id) ON DELETE SET NULL,
        cover_image_id uuid REFERENCES asset(id) ON DELETE SET NULL,
        whatsapp_number varchar(20),
        features_config jsonb DEFAULT '{}',
        is_default boolean NOT NULL DEFAULT true,
        is_published boolean NOT NULL DEFAULT false,
        onboarding_step integer NOT NULL DEFAULT 0,
        onboarding_completed_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS profile_user_id_idx ON profile(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS profile_username_idx ON profile(username)`);
    
    console.log("  ✓ Recreated profile table with all columns");
  } catch (error: any) {
    console.log(`  ℹ️  Profile table cleanup: ${error.message || 'skipped'}`);
  }

  // Try to delete test users, catch errors if tables don't exist
  const testEmails = ["test@wellness.com"];

  for (const email of testEmails) {
    try {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (existingUser) {
        // First delete related records
        await db.delete(profile).where(eq(profile.userId, existingUser.id));
        await db.delete(account).where(eq(account.userId, existingUser.id));
        await db.delete(session).where(eq(session.userId, existingUser.id));

        // Then delete user
        await db.delete(user).where(eq(user.id, existingUser.id));
        console.log(`  ✓ Deleted existing test user: ${email}`);
      }
    } catch (error) {
      // Tables might not exist yet, that's OK
      continue;
    }
  }

  console.log("");
}

// Run migration SQL files to create tables
async function runMigrations() {
  console.log("🔄 Running migrations to create tables...\n");
  const sql = postgres(process.env.DATABASE_URL!);
  const migrationsDir = join(__dirname, 'migrations');
  
  const migrationFiles = [
    '0000_foamy_felicia_hardy.sql',  // Crea tablas base
    '0002_eminent_big_bertha.sql',   // Crea profile (antes de modificarlo)
    '0001_warm_bloodstorm.sql',      // Modifica profile
    '0003_legal_jean_grey.sql',     // Agrega whatsapp y clientes
    '0004_conscious_giant_man.sql',   // Agrega servicios médicos
    '0005_exotic_sentinels.sql',     // Agrega time slots y reservations
    '0006_rename_social_link_url_to_username.sql',
  ];

  for (const file of migrationFiles) {
    try {
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');
      // Split into individual statements
      const statements = migrationSQL
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
      console.log(`  ✓ Migration ${file}`);
    } catch (e: any) {
      console.log(`  ❌ Migration ${file}: ${e.message}`);
      console.log(`  Stack: ${e.stack}`);
    }
  }

  console.log("\n✅ Database schema synced\n");
  await sql.end();
}

async function seed() {
  console.log("\n🌱 Starting database seeding...\n");
  console.log("=".repeat(50));
  console.log("\n");

  try {
    // 1. RUN MIGRATIONS: Create tables first
    await runMigrations();

    // 2. CLEANUP: Remove existing seed data (tables exist now)
    await cleanupSeedData();

    // 3. Execute seeders in dependency order
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

    // 6. Health Survey Responses (depends on profiles)
    await seedHealthSurveys();

    // 7. Medical Services (depends on profiles)
    await seedMedicalServices();

    // 8. Time Slots (depends on profiles & medical services)
    await seedTimeSlots();

    // 9. Clients (depends on profiles)
    await seedClients();

    // 10. Reservations (depends on profiles, services, time slots, clients)
    await seedReservations();

    // 11. Campaigns (depends on profiles)
    await seedCampaigns();

    // 12. Analytics (depends on profiles and social links)
    await seedAnalytics();

    console.log("\n" + "=".repeat(50));
    console.log("\n🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("  - 1 user created");
    console.log("  - 6 assets created (avatars, covers y slider antes/después)");
    console.log("  - 1 profile created");
    console.log("  - 4 social links created");
    console.log("  - 1 profile customization created");
    // REMOVED: Tu Historia summary
    // REMOVED: stories summary
    // REMOVED: story events summary
    console.log("  - 2 health survey responses created");
    console.log("  - 4 medical services created");
    console.log("  - 30+ time slots for the next 7 days");
    console.log("  - 5 clients created");
    console.log("  - 4 reservations (confirmed, completed, cancelled, no_show)");
    console.log("  - 3 campaign templates created");
    console.log("  - 3 campaigns created");
    console.log("  - 35+ profile views created");
    console.log("  - 40+ social clicks created");
    console.log("  - 5 QR downloads created\n");
    console.log("🔐 Login credentials:");
    console.log("  Email: test@wellness.com");
    console.log("  Password: test123456\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeder
seed();
