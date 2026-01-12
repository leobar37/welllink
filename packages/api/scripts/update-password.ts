import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

// New correct password hash for "test123456"
const NEW_HASH =
  "scrypt:82280affd25d56eccc3cd54908eca8b2:349e4435f4886221699a7f03f386eeee744e33bce3a932ad3182facfd31f32a4fd10b65f08141209c6758ccb5eba0fe9da1b4d3d23a61fb1a56e2fe7bcbbddf6";

async function updatePassword() {
  console.log("🔐 Updating password hash for test@wellness.com\n");

  const result = await sql`
    UPDATE account
    SET password = ${NEW_HASH}
    WHERE account_id = 'test@wellness.com'
    AND provider_id = 'credential'
    RETURNING id
  `;

  if (result.length > 0) {
    console.log("✅ Password hash updated successfully");
    console.log(`   Account ID: ${result[0].id}`);
  } else {
    console.log("❌ Account not found");
  }

  await sql.end();
}

updatePassword();
