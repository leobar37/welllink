// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { setDefaultResultOrder } from "node:dns";

// Force IPv4 DNS resolution BEFORE any database connection
// This MUST happen before postgres() is called
setDefaultResultOrder("ipv4first");
console.log("🔧 [DB] DNS resolution set to prefer IPv4");

// Validate DATABASE_URL before attempting connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "❌ FATAL ERROR: DATABASE_URL environment variable is not defined",
  );
  console.error(
    "📝 Available environment variables:",
    Object.keys(process.env).filter(
      (k: string) => k.includes("DATABASE") || k.includes("DB"),
    ),
  );
  console.error(
    "🔧 Please configure DATABASE_URL in your deployment platform (Dokploy)",
  );
  throw new Error(
    "DATABASE_URL is required. Set it to: postgresql://user:password@host:port/database",
  );
}

if (
  !databaseUrl.startsWith("postgresql://") &&
  !databaseUrl.startsWith("postgres://")
) {
  console.error("❌ FATAL ERROR: DATABASE_URL has invalid format");
  console.error("📝 Current value starts with:", databaseUrl.substring(0, 20));
  console.error(
    "✅ Expected format: postgresql://user:password@host:port/database",
  );
  throw new Error("DATABASE_URL must start with postgresql:// or postgres://");
}

// Log successful configuration (without exposing password)
const urlParts = databaseUrl.match(
  /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/,
);
if (urlParts) {
  console.log("✅ [DB] Connection configured:");
  console.log(`   Host: ${urlParts[3]}`);
  console.log(`   Port: ${urlParts[4]}`);
  console.log(`   Database: ${urlParts[5]}`);
  console.log(`   User: ${urlParts[1]}`);
} else {
  console.log(
    "✅ [DB] DATABASE_URL configured (length:",
    databaseUrl.length,
    ")",
  );
}

// Create connection with IPv4 preference (fixes IPv6 connection issues in Docker)
const client = postgres(databaseUrl, {
  connect_timeout: 10, // 10 seconds timeout
  idle_timeout: 20, // 20 seconds idle timeout
  max: 10, // Max connections
  ssl: "prefer", // Use SSL when available
  // Force IPv4 to avoid IPv6 connection issues in some environments
  // This prevents ECONNREFUSED errors on IPv6 addresses
});

console.log("✅ [DB] Connection pool created");

export const db = drizzle(client, { schema });

export * from "./schema";
