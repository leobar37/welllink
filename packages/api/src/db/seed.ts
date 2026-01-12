import { config } from "dotenv";
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
import { eq, or, like } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Load environment variables
config({ path: ".env" });

// Cleanup function to remove seed data before seeding
async function cleanupSeedData() {
  console.log("🧹 Cleaning up existing seed data...\n");

  // Delete specific profiles by username
  const testUsernames = ["maria_wellness"];
  for (const username of testUsernames) {
    const existingProfile = await db.query.profile.findFirst({
      where: eq(profile.username, username),
    });
    if (existingProfile) {
      await db.delete(profile).where(eq(profile.id, existingProfile.id));
      console.log(`  ✓ Deleted profile: @${username}`);
    }
  }

  // Delete test users (cascade will delete all related data)
  const testEmails = ["test@wellness.com"];

  for (const email of testEmails) {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      // First delete related records manually to handle orphans
      await db.delete(profile).where(eq(profile.userId, existingUser.id));
      await db.delete(account).where(eq(account.userId, existingUser.id));
      await db.delete(session).where(eq(session.userId, existingUser.id));
      
      // Then delete the user
      await db.delete(user).where(eq(user.id, existingUser.id));
      console.log(`  ✓ Deleted existing test user: ${email}`);
    }
  }

  // Also delete orphaned profiles (profiles without users)
  const allUsers = await db.query.user.findMany();
  if (allUsers.length === 0) {
    // No users exist, delete all profiles (they're orphans)
    await db.delete(profile);
    console.log(`  ✓ Deleted orphaned profiles`);
  } else {
    // Check for orphaned profiles
    const allProfiles = await db.query.profile.findMany();
    const orphanedProfiles = allProfiles.filter(
      p => !allUsers.some(u => u.id === p.userId)
    );
    for (const orphan of orphanedProfiles) {
      await db.delete(profile).where(eq(profile.id, orphan.id));
    }
    if (orphanedProfiles.length > 0) {
      console.log(`  ✓ Deleted ${orphanedProfiles.length} orphaned profiles`);
    }
  }

  console.log("");
}

// Create new tables if they don't exist
async function ensureTablesExist() {
  console.log("🔧 Ensuring all tables exist...\n");

  const tables = [
    {
      name: "medical_service",
      sql: sql`
        CREATE TABLE IF NOT EXISTS medical_service (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          name varchar(255) NOT NULL,
          description text,
          duration integer NOT NULL,
          price decimal(10, 2),
          category varchar(100),
          requirements text,
          is_active boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_medical_service_profile_id ON medical_service(profile_id);
        CREATE INDEX IF NOT EXISTS idx_medical_service_category ON medical_service(category);
        CREATE INDEX IF NOT EXISTS idx_medical_service_active ON medical_service(is_active);
      `,
    },
    {
      name: "time_slot",
      sql: sql`
        CREATE TABLE IF NOT EXISTS time_slot (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          service_id uuid NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
          start_time timestamp NOT NULL,
          end_time timestamp NOT NULL,
          max_reservations integer DEFAULT 1 NOT NULL,
          current_reservations integer DEFAULT 0 NOT NULL,
          status varchar(50) DEFAULT 'available' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          expires_at timestamp
        );
        CREATE INDEX IF NOT EXISTS idx_time_slot_profile_id ON time_slot(profile_id);
        CREATE INDEX IF NOT EXISTS idx_time_slot_service_id ON time_slot(service_id);
        CREATE INDEX IF NOT EXISTS idx_time_slot_start_time ON time_slot(start_time);
        CREATE INDEX IF NOT EXISTS idx_time_slot_status ON time_slot(status);
      `,
    },
    {
      name: "reservation_request",
      sql: sql`
        CREATE TABLE IF NOT EXISTS reservation_request (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          service_id uuid REFERENCES medical_service(id) ON DELETE SET NULL,
          patient_name varchar(255) NOT NULL,
          patient_phone varchar(50) NOT NULL,
          patient_email varchar(255),
          preferred_date date NOT NULL,
          preferred_time varchar(50),
          status varchar(50) DEFAULT 'pending' NOT NULL,
          notes text,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reservation_request_profile_id ON reservation_request(profile_id);
        CREATE INDEX IF NOT EXISTS idx_reservation_request_status ON reservation_request(status);
      `,
    },
    {
      name: "reservation",
      sql: sql`
        CREATE TABLE IF NOT EXISTS reservation (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          slot_id uuid NOT NULL REFERENCES time_slot(id) ON DELETE CASCADE,
          service_id uuid NOT NULL REFERENCES medical_service(id) ON DELETE CASCADE,
          request_id uuid REFERENCES reservation_request(id) ON DELETE SET NULL,
          patient_name varchar(255) NOT NULL,
          patient_phone varchar(50) NOT NULL,
          patient_email varchar(255),
          status varchar(50) DEFAULT 'confirmed' NOT NULL,
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
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL,
          cancelled_at timestamp
        );
        CREATE INDEX IF NOT EXISTS idx_reservation_profile_id ON reservation(profile_id);
        CREATE INDEX IF NOT EXISTS idx_reservation_slot_id ON reservation(slot_id);
        CREATE INDEX IF NOT EXISTS idx_reservation_status ON reservation(status);
        CREATE INDEX IF NOT EXISTS idx_reservation_patient_phone ON reservation(patient_phone);
        CREATE INDEX IF NOT EXISTS idx_reservation_created ON reservation(created_at);
      `,
    },
    {
      name: "availability_rule",
      sql: sql`
        CREATE TABLE IF NOT EXISTS availability_rule (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          day_of_week integer NOT NULL,
          start_time time NOT NULL,
          end_time time NOT NULL,
          is_available boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_availability_rule_profile_id ON availability_rule(profile_id);
      `,
    },
    {
      name: "client",
      sql: sql`
        CREATE TABLE IF NOT EXISTS client (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          health_survey_id uuid REFERENCES health_survey_response(id) ON DELETE SET NULL,
          name varchar(255) NOT NULL,
          phone varchar(20) NOT NULL,
          email varchar(255),
          label text DEFAULT 'consumidor' NOT NULL,
          notes text,
          last_contact_at timestamp,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_client_profile_id ON client(profile_id);
        CREATE INDEX IF NOT EXISTS idx_client_phone ON client(phone);
        CREATE INDEX IF NOT EXISTS idx_client_label ON client(label);
        CREATE INDEX IF NOT EXISTS idx_client_health_survey_id ON client(health_survey_id);
        CREATE INDEX IF NOT EXISTS idx_client_last_contact_at ON client(last_contact_at);
      `,
    },
    {
      name: "client_note",
      sql: sql`
        CREATE TABLE IF NOT EXISTS client_note (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
          content text NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_client_note_client_id ON client_note(client_id);
      `,
    },
    {
      name: "campaign_template",
      sql: sql`
        CREATE TABLE IF NOT EXISTS campaign_template (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          name varchar(255) NOT NULL,
          content text NOT NULL,
          objective varchar(100),
          variables jsonb DEFAULT '[]' NOT NULL,
          usage_count integer DEFAULT 0 NOT NULL,
          last_used_at timestamp,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_campaign_template_profile_id ON campaign_template(profile_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_template_name ON campaign_template(name);
      `,
    },
    {
      name: "campaign",
      sql: sql`
        CREATE TABLE IF NOT EXISTS campaign (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          template_id uuid REFERENCES campaign_template(id) ON DELETE SET NULL,
          name varchar(255) NOT NULL,
          objective varchar(100) NOT NULL,
          message_content text NOT NULL,
          total_recipients integer DEFAULT 0 NOT NULL,
          sent_count integer DEFAULT 0 NOT NULL,
          delivered_count integer DEFAULT 0 NOT NULL,
          failed_count integer DEFAULT 0 NOT NULL,
          status text DEFAULT 'draft' NOT NULL,
          scheduled_at timestamp,
          sent_at timestamp,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_campaign_profile_id ON campaign(profile_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaign(status);
        CREATE INDEX IF NOT EXISTS idx_campaign_scheduled_at ON campaign(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_campaign_template_id ON campaign(template_id);
      `,
    },
    {
      name: "campaign_audience",
      sql: sql`
        CREATE TABLE IF NOT EXISTS campaign_audience (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
          campaign_id uuid NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
          client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
          whatsapp_message_id uuid REFERENCES whatsapp_message(id) ON DELETE SET NULL,
          status text DEFAULT 'pending' NOT NULL,
          sent_at timestamp,
          delivered_at timestamp,
          error_message text,
          created_at timestamp DEFAULT now() NOT NULL,
          UNIQUE(campaign_id, client_id)
        );
        CREATE INDEX IF NOT EXISTS idx_campaign_audience_profile_id ON campaign_audience(profile_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_audience_campaign_id ON campaign_audience(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_audience_client_id ON campaign_audience(client_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_audience_status ON campaign_audience(status);
      `,
    },
  ];

  for (const table of tables) {
    try {
      await db.execute(table.sql);
      console.log(`  ✓ ${table.name} table ready`);
    } catch (e: any) {
      console.log(`  ⚠️  ${table.name} table creation note: ${e.message || 'already exists'}`);
    }
  }

  console.log("");
}

async function seed() {
  console.log("\n🌱 Starting database seeding...\n");
  console.log("=".repeat(50));
  console.log("\n");

  try {
    // 1. CLEANUP: Remove existing seed data
    await cleanupSeedData();

    // 2. ENSURE TABLES: Create new tables if they don't exist
    await ensureTablesExist();

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

    // 6. Tu Historia (depends on profiles & assets)
    // REMOVED: seedStories();

    // 7. Health Survey Responses (depends on profiles)
    await seedHealthSurveys();

    // 8. Medical Services (depends on profiles)
    await seedMedicalServices();

    // 9. Time Slots (depends on profiles & medical services)
    await seedTimeSlots();

    // 10. Clients (depends on profiles)
    await seedClients();

    // 11. Reservations (depends on profiles, services, time slots, clients)
    await seedReservations();

    // 12. Campaigns (depends on profiles)
    await seedCampaigns();

    // 13. Analytics (depends on profiles and social links)
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
