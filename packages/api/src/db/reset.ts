import { config } from "dotenv";
import postgres from "postgres";
import { env } from "../config/env";

// Load environment variables
config({ path: ".env" });

const sql = postgres(env.DATABASE_URL);

async function reset() {
  console.log("\n🗑️  Starting database reset...\n");
  console.log("⚠️  WARNING: This will DROP all tables and data!");
  console.log("=".repeat(50));
  console.log("\n");

  try {
    // Disable foreign key checks temporarily
    await sql`SET session_replication_role = 'replica';`;

    console.log("🔥 Dropping all tables...");

    // Drop tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS qr_download CASCADE;`;
    console.log("  ✓ Dropped qr_download");

    await sql`DROP TABLE IF EXISTS social_click CASCADE;`;
    console.log("  ✓ Dropped social_click");

    await sql`DROP TABLE IF EXISTS profile_view CASCADE;`;
    console.log("  ✓ Dropped profile_view");

    await sql`DROP TABLE IF EXISTS health_survey_response CASCADE;`;
    console.log("  ✓ Dropped health_survey_response");

    await sql`DROP TABLE IF EXISTS profile_customization CASCADE;`;
    console.log("  ✓ Dropped profile_customization");

    await sql`DROP TABLE IF EXISTS story_event CASCADE;`;
    console.log("  ✓ Dropped story_event");

    await sql`DROP TABLE IF EXISTS story CASCADE;`;
    console.log("  ✓ Dropped story");

    await sql`DROP TABLE IF EXISTS story_section CASCADE;`;
    console.log("  ✓ Dropped story_section");

    await sql`DROP TABLE IF EXISTS social_link CASCADE;`;
    console.log("  ✓ Dropped social_link");

    await sql`DROP TABLE IF EXISTS profile CASCADE;`;
    console.log("  ✓ Dropped profile");

    await sql`DROP TABLE IF EXISTS asset CASCADE;`;
    console.log("  ✓ Dropped asset");

    await sql`DROP TABLE IF EXISTS verification CASCADE;`;
    console.log("  ✓ Dropped verification");

    await sql`DROP TABLE IF EXISTS session CASCADE;`;
    console.log("  ✓ Dropped session");

    await sql`DROP TABLE IF EXISTS account CASCADE;`;
    console.log("  ✓ Dropped account");

    await sql`DROP TABLE IF EXISTS "user" CASCADE;`;
    console.log("  ✓ Dropped user");

    // Drop enums
    await sql`DROP TYPE IF EXISTS social_platform CASCADE;`;
    console.log("  ✓ Dropped social_platform enum");

    await sql`DROP TYPE IF EXISTS view_source CASCADE;`;
    console.log("  ✓ Dropped view_source enum");

    await sql`DROP TYPE IF EXISTS story_event_type CASCADE;`;
    console.log("  ✓ Dropped story_event_type enum");

    await sql`DROP TYPE IF EXISTS story_type CASCADE;`;
    console.log("  ✓ Dropped story_type enum");

    // Re-enable foreign key checks
    await sql`SET session_replication_role = 'origin';`;

    console.log("\n" + "=".repeat(50));
    console.log("\n✅ Database reset completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("  1. Run migrations: bun run drizzle-kit push");
    console.log("  2. Run seeder: bun run db:seed\n");

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    await sql.end();
    process.exit(1);
  }
}

// Run reset
reset();
