import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

async function listTables() {
  console.log("📋 Listing tables in database...\n");

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  if (tables.length === 0) {
    console.log("❌ No tables found in database");
  } else {
    console.log(`✅ Found ${tables.length} tables:\n`);
    tables.forEach((t) => {
      console.log(`  - ${t.table_name}`);
    });
  }

  await sql.end();
}

listTables();
