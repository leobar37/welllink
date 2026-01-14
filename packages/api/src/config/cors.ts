/**
 * Shared CORS configuration
 * Used by both Elysia CORS middleware and Better Auth trustedOrigins
 */

import { env } from "./env";

/**
 * Get allowed origins from environment variable or use defaults
 * In development: accepts any localhost port
 * In production: uses specific origins from env or production URLs
 * @returns Array of allowed origins
 */
/**
 * Get allowed origins for Better Auth (supports array or function)
 * @returns Array of allowed origins or function for dynamic check
 */
export const getAllowedOrigins = ():
  | string[]
  | ((request: Request) => string[] | Promise<string[]>) => {
  const envOrigins = env.CORS_ORIGIN;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  if (env.NODE_ENV !== "production") {
    return () => ["*"]; // Allow all origins in development
  }

  return [];
};

/**
 * Get allowed origins for Elysia CORS middleware
 * Supports both array and boolean (true = allow all)
 * @returns Array of allowed origins or true for allowing all origins
 */
export const getCorsOrigins = (): string[] | true => {
  const envOrigins = env.CORS_ORIGIN;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  if (env.NODE_ENV !== "production") {
    return true;
  }

  return [];
};
