import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import { getAllowedOrigins } from "../config/cors";
import { env } from "../config/env";

// Check if we're in production
const isProduction = env.NODE_ENV === "production";

const allowedOrigins = getAllowedOrigins();

console.log("🔐 [Auth] Initializing Better Auth");
console.log(`   Environment: ${env.NODE_ENV}`);
console.log(`   Base URL: ${env.BETTER_AUTH_URL}`);
console.log(
  `   Trusted Origins: ${
    typeof allowedOrigins === "function"
      ? "any (dev mode)"
      : allowedOrigins.join(", ")
  }`,
);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      account: schema.account,
      session: schema.session,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for now to simplify testing
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  // Advanced cookie configuration for cross-site scenarios
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: isProduction,
    // Default cookie attributes - for cross-site requests in production
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : "lax", // "none" for cross-site in production
      secure: isProduction, // Required when sameSite is "none"
      httpOnly: true,
      partitioned: isProduction, // Required for third-party cookies (CHIPS)
    },
    crossSubDomainCookies: {
      enabled: false, // Not needed for cross-origin (different domains)
    },
  },
  // Set trusted origins for CORS
  trustedOrigins: allowedOrigins,
  socialProviders: {}, // No social providers for now
});
