import { type Page, type Locator } from "@playwright/test";
import { TEST_CREDENTIALS } from "../fixtures/test-data";

/**
 * Database helper for E2E tests.
 * Provides functions to reset and manipulate test data.
 *
 * IMPORTANT: This helper uses the backend API to manipulate the DB.
 * Functions assume a test endpoint exists in the backend.
 */
export class DatabaseHelper {
  private baseURL: string;
  private apiToken: string | null = null;

  constructor(
    page: Page,
    options: { baseURL?: string; apiToken?: string } = {},
  ) {
    // Use provided base URL or default (API runs on port 5300)
    this.baseURL = options.baseURL || "http://localhost:5300";
    this.apiToken = options.apiToken || null;
  }

  /**
   * Make a request to the backend API.
   */
  private async apiRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    body?: Record<string, unknown>,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API token if available
    if (this.apiToken) {
      headers["Authorization"] = `Bearer ${this.apiToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  }

  /**
   * Set authentication token for requests.
   */
  setApiToken(token: string): void {
    this.apiToken = token;
  }

  /**
   * Complete reset of test database.
   * Note: Requires /api/test/reset-db endpoint in backend.
   */
  async resetDatabase(): Promise<boolean> {
    try {
      const response = await this.apiRequest("/api/test/reset-db", "POST");
      return response.ok;
    } catch (error) {
      console.warn("Database reset endpoint not available:", error);
      return false;
    }
  }

  /**
   * Create a test user.
   * Note: Requires /api/test/create-user endpoint in backend.
   */
  async createTestUser(userData?: {
    email?: string;
    password?: string;
    name?: string;
  }): Promise<{ id: string; email: string } | null> {
    try {
      const response = await this.apiRequest("/api/test/create-user", "POST", {
        email: userData?.email || "test@wellness.com",
        password: userData?.password || "test123456",
        name: userData?.name || "Test User",
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn("Create user endpoint not available:", error);
      return null;
    }
  }

  /**
   * Clean up all E2E test data.
   */
  async cleanupTestData(): Promise<boolean> {
    try {
      const response = await this.apiRequest("/api/test/cleanup", "POST");
      return response.ok;
    } catch (error) {
      console.warn("Cleanup endpoint not available:", error);
      return false;
    }
  }

  /**
   * Seed initial test data.
   */
  async seedTestData(): Promise<boolean> {
    try {
      const response = await this.apiRequest("/api/test/seed", "POST");
      return response.ok;
    } catch (error) {
      console.warn("Seed endpoint not available:", error);
      return false;
    }
  }

  /**
   * Get current database status (for debugging).
   */
  async getDatabaseStatus(): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.apiRequest("/api/test/status", "GET");
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn("Status endpoint not available:", error);
      return null;
    }
  }
}

/**
 * Create a DatabaseHelper for a specific page.
 */
export function createDatabaseHelper(page: Page): DatabaseHelper {
  return new DatabaseHelper(page);
}

/**
 * Playwright fixture for database.
 * Adds 'db' to each test context.
 */
export const dbFixture = {
  /**
   * Automatic before each hook.
   */
  beforeEach: async ({ page }: { page: Page }) => {
    const db = createDatabaseHelper(page);
    return { db };
  },
};
