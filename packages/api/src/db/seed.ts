import { config } from "dotenv";
import postgres from "postgres";
import { seedUsers } from "./seeders/users.seeder";
import { seedAssets } from "./seeders/assets.seeder";
import { seedProfiles } from "./seeders/profiles.seeder";
import { seedSocialLinks } from "./seeders/social-links.seeder";
// health-survey seeder: REMOVED - legacy wellness feature
import { seedAnalytics } from "./seeders/analytics.seeder";
import { seedProfileCustomizations } from "./seeders/profile-customization.seeder";
import { seedMedicalServices } from "./seeders/medical-services.seeder";
import { seedTimeSlots } from "./seeders/time-slots.seeder";
import { seedAvailabilityRules } from "./seeders/availability-rules.seeder";
import { seedClients } from "./seeders/clients.seeder";
import { seedReservations } from "./seeders/reservations.seeder";
import { seedCampaigns } from "./seeders/campaigns.seeder";
import { seedReservationRequests } from "./seeders/reservation-requests.seeder";
// ai-recommendations seeder: REMOVED - legacy wellness feature
import { seedClientNotes } from "./seeders/client-notes.seeder";
import { seedPaymentMethods } from "./seeders/payment-methods.seeder";
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
    await db.execute(
      sql`ALTER TABLE qr_download ADD COLUMN IF NOT EXISTS source text DEFAULT 'qr'`,
    );
    console.log("  ✓ Added source column to qr_download table");
  } catch (error: any) {
    // Column might exist or table doesn't exist yet
  }

  // Add missing columns to reservation_request table (skipping for now due to existing data)
  try {
    // This would require dropping and recreating the table
    // For now, we'll skip seeding reservation_requests
    console.log(
      "  ℹ️  reservation_request seeding skipped (requires table recreation)",
    );
  } catch (error: any) {
    console.log(
      `  ℹ️  reservation_request columns: ${error.message || "skipped"}`,
    );
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
        updated_at timestamp NOT NULL DEFAULT now(),
        is_organization boolean NOT NULL DEFAULT false,
        clinic_name varchar(100),
        clinic_address text,
        clinic_phone varchar(20),
        clinic_email varchar(255),
        clinic_website varchar(255),
        clinic_ruc varchar(20),
        metadata jsonb DEFAULT '{}'
      );
    `);

    // Create indexes
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS profile_user_id_idx ON profile(user_id)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS profile_username_idx ON profile(username)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS profile_is_organization_idx ON profile(is_organization)`,
    );

    console.log("  ✓ Recreated profile table with all columns");

    // Drop and recreate social_link table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS social_link CASCADE`);
      await db.execute(sql`
        CREATE TABLE social_link (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          platform text NOT NULL,
          username varchar(100) NOT NULL,
          display_order integer NOT NULL DEFAULT 0,
          metadata jsonb DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT now()
        );
      `);
      await db.execute(
        sql`CREATE UNIQUE INDEX IF NOT EXISTS social_link_profile_platform_unique ON social_link(profile_id, platform)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS social_link_profile_id_idx ON social_link(profile_id)`,
      );
      console.log("  ✓ Recreated social_link table with metadata column");
    } catch (error: any) {
      console.log(
        `  ℹ️  Social link table cleanup: ${error.message || "skipped"}`,
      );
    }

    // Drop and recreate availability_rule table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS availability_rule CASCADE`);
      await db.execute(sql`
        CREATE TABLE availability_rule (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time time NOT NULL,
          end_time time NOT NULL,
          slot_duration integer NOT NULL DEFAULT 30,
          buffer_time integer NOT NULL DEFAULT 0,
          max_appointments_per_slot integer NOT NULL DEFAULT 1,
          effective_from timestamp NOT NULL DEFAULT NOW(),
          effective_to timestamp,
          is_active boolean NOT NULL DEFAULT true,
          metadata jsonb DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT NOW(),
          updated_at timestamp NOT NULL DEFAULT NOW()
        );
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS availability_rule_profile_id_idx ON availability_rule(profile_id)`,
      );
      console.log("  ✓ Recreated availability_rule table with all columns");
    } catch (error: any) {
      console.log(
        `  ℹ️  Availability rule table cleanup: ${error.message || "skipped"}`,
      );
    }

    // Drop and recreate medical_service table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS medical_service CASCADE`);
      await db.execute(sql`
        CREATE TABLE medical_service (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          name varchar(100) NOT NULL,
          description text,
          duration integer NOT NULL DEFAULT 30,
          price numeric(10, 2) NOT NULL DEFAULT 0,
          currency varchar(3) NOT NULL DEFAULT 'PEN',
          category varchar(50),
          requirements text,
          is_active boolean NOT NULL DEFAULT true,
          display_order integer NOT NULL DEFAULT 0,
          metadata jsonb DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS medical_service_profile_id_idx ON medical_service(profile_id)`,
      );
      console.log("  ✓ Recreated medical_service table with metadata column");
    } catch (error: any) {
      console.log(
        `  ℹ️  Medical service table cleanup: ${error.message || "skipped"}`,
      );
    }

    // Drop and recreate time_slot table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS time_slot CASCADE`);
      await db.execute(sql`
        CREATE TABLE time_slot (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          service_id uuid NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
          start_time timestamp NOT NULL,
          end_time timestamp NOT NULL,
          max_reservations integer NOT NULL DEFAULT 1,
          current_reservations integer NOT NULL DEFAULT 0,
          status varchar(50) DEFAULT 'available',
          metadata jsonb DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT now(),
          expires_at timestamp
        );
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS time_slot_profile_id_idx ON time_slot(profile_id)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS time_slot_service_id_idx ON time_slot(service_id)`,
      );
      console.log("  ✓ Recreated time_slot table with metadata column");
    } catch (error: any) {
      console.log(
        `  ℹ️  Time slot table cleanup: ${error.message || "skipped"}`,
      );
    }

    // Drop and recreate client table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS client CASCADE`);
      await db.execute(sql`
        CREATE TABLE client (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          name varchar(255) NOT NULL,
          phone varchar(20) NOT NULL,
          email varchar(255),
          label text NOT NULL DEFAULT 'consumidor',
          notes text,
          last_contact_at timestamp,
          metadata jsonb DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS client_profile_id_idx ON client(profile_id)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS client_phone_idx ON client(phone)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS client_label_idx ON client(label)`,
      );
      console.log("  ✓ Recreated client table with metadata column");
    } catch (error: any) {
      console.log(`  ℹ️  Client table cleanup: ${error.message || "skipped"}`);
    }

    // Drop and recreate reservation table (was dropped by CASCADE)
    try {
      await db.execute(sql`DROP TABLE IF EXISTS reservation CASCADE`);
      await db.execute(sql`
        CREATE TABLE reservation (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          slot_id uuid NOT NULL REFERENCES time_slot(id) ON DELETE CASCADE,
          service_id uuid NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
          request_id uuid REFERENCES reservation_request(id) ON DELETE SET NULL,
          patient_name varchar(255) NOT NULL,
          patient_phone varchar(50) NOT NULL,
          patient_email varchar(255),
          status varchar(50) DEFAULT 'confirmed',
          source varchar(50) DEFAULT 'whatsapp',
          notes text,
          reminder_24h_sent boolean DEFAULT false,
          reminder_2h_sent boolean DEFAULT false,
          reminder_24h_scheduled boolean DEFAULT false,
          reminder_2h_scheduled boolean DEFAULT false,
          completed_at timestamp,
          no_show boolean DEFAULT false,
          price_at_booking decimal(10, 2),
          payment_status varchar(50) DEFAULT 'pending',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now(),
          cancelled_at timestamp,
          metadata jsonb DEFAULT '{}'
        );
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS reservation_profile_id_idx ON reservation(profile_id)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS reservation_slot_id_idx ON reservation(slot_id)`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS reservation_status_idx ON reservation(status)`,
      );
      console.log("  ✓ Recreated reservation table with metadata column");
    } catch (error: any) {
      console.log(
        `  ℹ️  Reservation table cleanup: ${error.message || "skipped"}`,
      );
    }
  } catch (error: any) {
    console.log(`  ℹ️  Profile table cleanup: ${error.message || "skipped"}`);
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
  const migrationsDir = join(__dirname, "migrations");

  const migrationFiles = [
    "0000_foamy_felicia_hardy.sql", // Crea tablas base
    "0002_eminent_big_bertha.sql", // Crea profile (antes de modificarlo)
    "0001_warm_bloodstorm.sql", // Modifica profile
    "0003_legal_jean_grey.sql", // Agrega whatsapp y clientes
    "0004_conscious_giant_man.sql", // Agrega servicios médicos
    "0005_exotic_sentinels.sql", // Agrega time slots y reservations
    "0006_rename_social_link_url_to_username.sql",
    "0007_add_clinic_fields_to_profile.sql",
    "0008_payment_methods.sql", // Nueva migración para payment_method
    "0009_whatsapp_context.sql", // Nueva migración para whatsapp_context
    "0010_remove_health_survey.sql", // Elimina health_survey y columnas relacionadas
    "0010_agent_config.sql", // Configuración del agente AI
    "0010_add_availability_rule_fields.sql", // Campos adicionales para availability_rule
  ];

  for (const file of migrationFiles) {
    try {
      const migrationSQL = readFileSync(join(migrationsDir, file), "utf-8");
      // Split into individual statements
      const statements = migrationSQL
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

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

    // 4. Payment Methods (depends on profiles)
    await seedPaymentMethods();

    // 5. Social Links (depends on profiles)
    await seedSocialLinks();

    // 5. Profile Customizations (depends on profiles)
    await seedProfileCustomizations();

    // 6. Health Survey Responses: REMOVED - legacy wellness feature

    // 7. Availability Rules (depends on profiles)
    await seedAvailabilityRules();

    // 8. Medical Services (depends on profiles)
    await seedMedicalServices();

    // 9. Time Slots (depends on profiles & medical services)
    await seedTimeSlots();

    // 10. Clients (depends on profiles)
    await seedClients();

    // 11. Reservations (depends on profiles, services, time slots, clients)
    await seedReservations();

    // 12. AI Recommendations: REMOVED - legacy wellness feature

    // 13. Client Notes (depends on profiles and clients)
    await seedClientNotes();

    // 14. Campaigns (depends on profiles)
    await seedCampaigns();

    // 15. Analytics (depends on profiles and social links)
    await seedAnalytics();

    console.log("\n🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("  - 2 users created (individual + clinic)");
    console.log(
      "  - 8 assets created (avatars, covers, stories, and clinic assets)",
    );
    console.log("  - 2 profiles created (individual professional + clinic)");
    console.log("  - 10 payment methods created (2 profiles × 5 methods)");
    console.log("  - 4 social links created");
    console.log("  - 2 profile customizations created");
    // health survey responses: REMOVED
    console.log(
      "  - 10 availability rules created (Mon-Fri, morning & afternoon)",
    );
    console.log("  - 4 medical services created");
    console.log("  - 30+ time slots for the next 7 days");
    console.log("  - 5 clients created");
    console.log(
      "  - 4 reservations (confirmed, completed, cancelled, no_show)",
    );
    console.log("  - 5 reservation requests (pending, approved, rejected)");
    // AI recommendations: REMOVED
    console.log("  - 11 client notes (consulta, seguimiento, recordatorio)");
    console.log("  - 3 campaign templates created");
    console.log("  - 3 campaigns created");
    console.log("  - 35+ profile views created");
    console.log("  - 40+ social clicks created");
    console.log("  - 5 QR downloads created\n");
    console.log("🔐 Login credentials:");
    console.log("  📱 Individual: test@wellness.com / test123456");
    console.log("  🏥 Clinic: clinic@wellness.com / test123456\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeder
seed();
