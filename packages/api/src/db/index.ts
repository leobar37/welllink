import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

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

// Create connection
const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });

export * from "./schema";
