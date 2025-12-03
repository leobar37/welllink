import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import { getAllowedOrigins } from "../config/cors";

// Get base URL from environment or use default
const getBaseURL = (): string => {
  return process.env.BETTER_AUTH_URL || "http://localhost:5300";
};

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production";

console.log("🔐 [Auth] Initializing Better Auth");
console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`   Base URL: ${getBaseURL()}`);
console.log(`   Trusted Origins: ${getAllowedOrigins().join(", ")}`);

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret:
    process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",
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
  trustedOrigins: getAllowedOrigins(),
  socialProviders: {}, // No social providers for now
});
