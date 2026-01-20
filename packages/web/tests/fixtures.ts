import {
  test as base,
  type Page,
  type Locator,
  type Expect,
} from "@playwright/test";
import { createAuthHelper } from "./e2e/utils/auth.helper";
import { createDatabaseHelper } from "./e2e/utils/db.helper";

/**
 * Global fixtures for E2E tests.
 * These fixtures are automatically available in all tests.
 */
export const test = base.extend<{
  auth: ReturnType<typeof createAuthHelper>;
  db: ReturnType<typeof createDatabaseHelper>;
  authenticatedPage: {
    page: Page;
    auth: ReturnType<typeof createAuthHelper>;
    db: ReturnType<typeof createDatabaseHelper>;
  };
}>({
  // Auth fixture - automatically logs in before each test
  auth: [
    async ({ page }, use) => {
      const auth = createAuthHelper(page);
      await auth.login();
      await use(auth);
      await auth.logout();
    },
    { scope: "test" },
  ],

  // Database fixture - provides DB operations capability
  db: [
    async ({ page }, use) => {
      const db = createDatabaseHelper(page);
      await use(db);
    },
    { scope: "test" },
  ],

  // Combined fixture - logs in without automatic seeding
  // Note: Run `bun run db:seed` once before running tests to seed the database
  authenticatedPage: [
    async ({ page }, use) => {
      const auth = createAuthHelper(page);
      const db = createDatabaseHelper(page);

      // Login (no automatic seeding to avoid API crashes during parallel tests)
      await auth.login();

      // Provide page with auth context to test
      await use({ page, auth, db });

      // Cleanup
      await auth.logout();
    },
    { scope: "test" },
  ],
});

export { expect } from "@playwright/test";
export type { Page, Locator, Expect };
