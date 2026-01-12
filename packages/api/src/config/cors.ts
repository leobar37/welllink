/**
 * Shared CORS configuration
 * Used by both Elysia CORS middleware and Better Auth trustedOrigins
 */

/**
 * Get allowed origins from environment variable or use defaults
 * In development: accepts any localhost port
 * In production: uses specific origins from env or production URLs
 * @returns Array of allowed origins
 */
export const getAllowedOrigins = (): string[] => {
  // Use environment variable if explicitly set
  const envOrigins = process.env.CORS_ORIGIN;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  // In dev mode, return array of localhost origins
  // Both Elysia CORS and Better Auth accept array format
  if (process.env.NODE_ENV !== "production") {
    return ["http://localhost:5179", "http://localhost:5300"];
  }

  // Production fallback - should be configured via CORS_ORIGIN env var
  return [];
};

/**
 * Get allowed origins for Elysia CORS middleware
 * Supports both array and boolean (true = allow all)
 * @returns Array of allowed origins or true for allowing all origins
 */
export const getCorsOrigins = (): string[] | true => {
  const envOrigins = process.env.CORS_ORIGIN;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  // In dev mode, return true to accept any origin (Elysia specific)
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return [];
};
