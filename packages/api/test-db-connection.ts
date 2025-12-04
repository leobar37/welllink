// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env" });

console.log("\n=== Testing Database Connection ===\n");
console.log("1. Environment Variables:");
console.log("   DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("   First 60 chars:", process.env.DATABASE_URL?.substring(0, 60));
console.log("   Length:", process.env.DATABASE_URL?.length);

// Extract hostname
const match = process.env.DATABASE_URL?.match(/@([^:]+):/);
if (match) {
  console.log("   Hostname:", match[1]);
}

console.log("\n2. Testing postgres connection:");
try {
  const postgres = (await import("postgres")).default;
  const client = postgres(process.env.DATABASE_URL!, {
    connect_timeout: 5,
    max: 1,
  });

  console.log("   ✅ Postgres client created");

  // Test query
  const result = await client`SELECT 1 as test`;
  console.log("   ✅ Query successful:", result);

  await client.end();
  console.log("   ✅ Connection closed");
} catch (error: any) {
  console.error("   ❌ Error:", error.message);
  console.error("   Error code:", error.code);
}

console.log("\n3. Testing drizzle connection:");
try {
  const { db } = await import("./src/db/index.js");
  const { user } = await import("./src/db/schema/auth.js");

  console.log("   ✅ Drizzle imported");

  // Test query
  const result = await db.select().from(user).limit(1);
  console.log("   ✅ Query successful, found", result.length, "users");
} catch (error: any) {
  console.error("   ❌ Error:", error.message);
  console.error("   Error code:", error.code);
}

console.log("\n=== Test Complete ===\n");
process.exit(0);
