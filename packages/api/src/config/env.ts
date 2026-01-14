// Centralized environment configuration
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env" });

interface EnvConfig {
  // App
  NODE_ENV: string;
  PORT: string;
  PUBLIC_URL: string;
  API_BASE_URL: string;

  // Database
  DATABASE_URL: string;

  // Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // CORS
  CORS_ORIGIN: string;

  // Storage
  STORAGE_PROVIDER: string;
  STORAGE_BUCKET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Evolution API
  EVOLUTION_API_URL: string;
  EVOLUTION_API_KEY: string;

  // Inngest
  INNGEST_APP_ID: string;
  INNGEST_EVENT_KEY: string;
  INNGEST_DEV_SERVER_URL: string;
  INNGEST_BASE_URL: string;

  // Fireworks AI
  FIREWORKS_API_KEY: string;

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "5300",
  PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:5300",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5300",

  DATABASE_URL: process.env.DATABASE_URL || "",

  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "dev-secret",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5300",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || "wellness-assets",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || "",

  INNGEST_APP_ID: process.env.INNGEST_APP_ID || "medical-chatbot-platform",
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || "",
  INNGEST_DEV_SERVER_URL:
    process.env.INNGEST_DEV_SERVER_URL || "http://localhost:8288",
  INNGEST_BASE_URL: process.env.INNGEST_BASE_URL || "https://api.inngest.com",

  FIREWORKS_API_KEY: process.env.FIREWORKS_API_KEY || "",

  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
};

export { env };
