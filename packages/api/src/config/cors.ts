/**
 * Shared CORS configuration
 * Used by both Elysia CORS middleware and Better Auth trustedOrigins
 */

// Default development origins
const DEFAULT_ORIGINS = [
  "http://localhost:5176",
  "http://localhost:5175",
  "http://localhost:5178",
  "http://localhost:5174",
];

/**
 * Get allowed origins from environment variable or use defaults
 * @returns Array of allowed origins for CORS
 */
export const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ORIGIN;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }
  return DEFAULT_ORIGINS;
};
