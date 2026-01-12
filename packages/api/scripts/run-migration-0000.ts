import { config } from "dotenv";
import { readFileSync } from "node:fs";
import postgres from "postgres";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

async function runMigration() {
  console.log("🔄 Running migration 0000...\n");

  try {
    const migration = readFileSync(
      "./src/db/migrations/0000_foamy_felicia_hardy.sql",
      "utf-8",
    );

    await sql.unsafe(migration);

    console.log("✅ Migration 0000 executed successfully!");

    await sql.end();
  } catch (error) {
    console.error("\n❌ Error running migration:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
