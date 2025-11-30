import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
} satisfies Config;
