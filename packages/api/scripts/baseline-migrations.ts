import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import postgres from "postgres";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
};

async function baselineMigrations() {
  const migrationsDir = "./src/db/migrations";
  const journalPath = join(migrationsDir, "meta", "_journal.json");

  const journal = JSON.parse(
    readFileSync(journalPath, "utf-8"),
  ) as { entries: JournalEntry[] };

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM drizzle.__drizzle_migrations
  `;

  if (count > 0) {
    console.log("ℹ️  Migrations already recorded, skipping baseline");
    return;
  }

  const [{ tableName }] = await sql<{ tableName: string | null }[]>`
    SELECT to_regclass('public.account') AS "tableName"
  `;

  if (!tableName) {
    console.log("ℹ️  No existing schema detected, skipping baseline");
    return;
  }

  const migrations = journal.entries.map((entry) => {
    const sqlPath = join(migrationsDir, `${entry.tag}.sql`);
    const sqlText = readFileSync(sqlPath, "utf-8");
    const hash = crypto.createHash("sha256").update(sqlText).digest("hex");

    return {
      hash,
      createdAt: entry.when,
      tag: entry.tag,
    };
  });

  for (const migration of migrations) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      SELECT ${migration.hash}, ${migration.createdAt}
      WHERE NOT EXISTS (
        SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${migration.hash}
      )
    `;
    console.log(`✅ Baseline recorded: ${migration.tag}`);
  }
}

baselineMigrations()
  .catch((error) => {
    console.error("❌ Error baselining migrations:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
