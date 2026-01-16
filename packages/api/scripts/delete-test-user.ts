import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

const db = postgres(process.env.DATABASE_URL!);

async function deleteAndRegister() {
  console.log("🗑️ Deleting existing test user...");

  await db`DELETE FROM account WHERE account_id = 'test@wellness.com'`;
  await db`DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE email = 'test@wellness.com')`;
  await db`DELETE FROM "user" WHERE email = 'test@wellness.com'`;

  console.log("✅ Deleted\n");

  console.log("👤 Registering new test user via API...\n");

  const response = await fetch("http://localhost:5300/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@wellness.com",
      password: "test123456",
      name: "María Test",
    }),
  });

  const result = await response.json();

  if (response.ok) {
    console.log("✅ User registered successfully!");
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("❌ Error:", result);
  }
}

deleteAndRegister()
  .catch(console.error)
  .finally(() => db.end());
