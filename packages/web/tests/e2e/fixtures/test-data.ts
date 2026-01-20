import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Test credentials configured in the application.
 * These credentials must exist in the test database.
 */
export const TEST_CREDENTIALS = {
  email: "test@wellness.com",
  password: "test123456",
} as const;

/**
 * Test user data for creating new users.
 */
export const TEST_USER_DATA = {
  email: "e2e-test-user@example.com",
  password: "SecureTestPassword123!",
  name: "E2E Test User",
} as const;

/**
 * Test profile data.
 */
export const TEST_PROFILE_DATA = {
  displayName: "Dra. E2E Test",
  username: "e2e-test-doctor",
  title: "Médica General",
  bio: "Médica general con especialización en wellness y salud holística.",
  whatsappNumber: "+1234567890",
} as const;

/**
 * Updated profile data for edit tests.
 */
export const UPDATED_PROFILE_DATA = {
  displayName: "Dr. E2E Test Updated",
  username: "e2e-test-doctor-updated",
  title: "Especialista en Wellness",
  bio: "Especialista en wellness con enfoque integral de salud.",
  whatsappNumber: "+0987654321",
} as const;

/**
 * Common wait intervals for the application.
 */
export const WAIT_INTERVALS = {
  short: 500,
  medium: 1000,
  long: 3000,
  veryLong: 5000,
} as const;

/**
 * Base URLs for different sections of the application.
 */
export const APP_URLS = {
  home: "/",
  auth: "/auth",
  login: "/auth/login",
  register: "/auth/register",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  settings: "/settings",
  themes: "/dashboard/themes",
  social: "/dashboard/social",
  features: "/dashboard/features",
} as const;
