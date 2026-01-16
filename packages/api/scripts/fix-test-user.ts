import { config } from "dotenv";
import postgres from "postgres";
import { scryptSync, randomBytes } from "node:crypto";

config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!);

const SCRYPT_N = 16384;
const SCRYPT_R = 16;
const SCRYPT_P = 1;
const KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function fixTestUser() {
  console.log("🗑️ Deleting existing test user...");

  // Delete existing account
  await sql`DELETE FROM account WHERE account_id = 'test@wellness.com'`;
  console.log("  ✓ Deleted existing account");

  // Delete existing session
  await sql`DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE email = 'test@wellness.com')`;
  console.log("  ✓ Deleted existing sessions");

  // Delete existing user
  await sql`DELETE FROM "user" WHERE email = 'test@wellness.com'`;
  console.log("  ✓ Deleted existing user");

  console.log("👤 Creating new test user...");

  const userId = "user_test_wellness";
  const passwordHash = hashPassword("test123456");

  // Insert user
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
    VALUES (
      ${userId},
      'María Test',
      'test@wellness.com',
      true,
      'https://ui-avatars.com/api/?name=Maria+Test&background=4F46E5&color=fff',
      NOW(),
      NOW()
    )
  `;
  console.log("  ✓ User created");

  // Insert account with password
  await sql`
    INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES (
      'account_' || ${userId},
      'test@wellness.com',
      'credential',
      ${userId},
      ${passwordHash},
      NOW(),
      NOW()
    )
  `;
  console.log("  ✓ Account created with password");

  console.log("\n✅ Test user fixed successfully!");
  console.log(`   Email: test@wellness.com`);
  console.log(`   Password: test123456`);
  console.log(`   Hash: ${passwordHash}`);
}

fixTestUser()
  .catch(console.error)
  .finally(() => sql.end());
