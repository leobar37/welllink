import { config } from "dotenv";
import { db } from "./index";
import { sql } from "drizzle-orm";

config({ path: ".env" });

async function runMigration() {
  console.log("🔄 Running migration: Add availability rule fields...\n");

  try {
    // Add new columns to availability_rule table
    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "slot_duration" integer NOT NULL DEFAULT 30
    `);
    console.log("  ✓ Added slot_duration column");

    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "buffer_time" integer NOT NULL DEFAULT 0
    `);
    console.log("  ✓ Added buffer_time column");

    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "max_appointments_per_slot" integer NOT NULL DEFAULT 1
    `);
    console.log("  ✓ Added max_appointments_per_slot column");

    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone NOT NULL DEFAULT NOW()
    `);
    console.log("  ✓ Added effective_from column");

    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone
    `);
    console.log("  ✓ Added effective_to column");

    await db.execute(sql`
      ALTER TABLE "availability_rule" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
    `);
    console.log("  ✓ Added updated_at column");

    // Rename is_available to is_active if needed
    try {
      await db.execute(sql`
        ALTER TABLE "availability_rule" RENAME COLUMN "is_available" TO "is_active"
      `);
      console.log("  ✓ Renamed is_available to is_active");
    } catch (e) {
      // Column might already be named is_active
      console.log("  ℹ️  is_available column already renamed or doesn't exist");
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
