# E2E Testing Infrastructure - MediApp

## 📋 Overview

This document describes the end-to-end (E2E) testing infrastructure implemented for the MediApp project. It includes test organization, fixtures, utilities, and guidelines for writing and running tests.

**Last Updated:** January 2026  
**Test Framework:** Playwright with Bun  
**Status:** 34/34 tests passing ✅

---

## 🏗️ Project Structure

```
packages/web/tests/
├── fixtures.ts                          # Global fixtures (auth + DB)
└── e2e/
    ├── config/
    │   ├── profile.spec.ts             # Profile settings tests (15 tests)
    │   ├── settings.spec.ts            # Settings tests (13 tests)
    │   └── profile-seed.spec.ts        # Seed verification tests (5 tests)
    ├── fixtures/
    │   └── test-data.ts                # Test constants & URLs
    └── utils/
        ├── auth.helper.ts              # Authentication helper
        └── db.helper.ts                # Database helper
```

---

## 📊 Test Coverage Summary

| Category               | Tests  | Status              |
| ---------------------- | ------ | ------------------- |
| Profile Settings       | 15     | ✅ Passing          |
| Settings               | 13     | ✅ Passing          |
| Profile with Seed Data | 5      | ✅ Passing          |
| **Total**              | **34** | **✅ 100% Passing** |

---

## ⚙️ Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5179",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
```

---

## 🔧 Global Fixtures

### Main Fixtures (`fixtures.ts`)

```typescript
import { test as base } from "@playwright/test";
import { createAuthHelper } from "./e2e/utils/auth.helper";
import { createDatabaseHelper } from "./e2e/utils/db.helper";

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

  // Database fixture
  db: [
    async ({ page }, use) => {
      const db = createDatabaseHelper(page);
      await use(db);
    },
    { scope: "test" },
  ],

  // Combined fixture - logs in without automatic seeding
  authenticatedPage: [
    async ({ page }, use) => {
      const auth = createAuthHelper(page);
      const db = createDatabaseHelper(page);

      await auth.login();
      await use({ page, auth, db });
      await auth.logout();
    },
    { scope: "test" },
  ],
});
```

**Usage in tests:**

```typescript
test("should update profile", async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  await page.goto("/dashboard/profile");
  // ...
});
```

---

## 📋 Test Data & Constants

### `e2e/fixtures/test-data.ts`

```typescript
// Test credentials (must exist in database)
export const TEST_CREDENTIALS = {
  email: "test@wellness.com",
  password: "test123456",
} as const;

// Test profile data
export const TEST_PROFILE_DATA = {
  displayName: "Dra. E2E Test",
  username: "e2e-test-doctor",
  title: "Médica General",
  bio: "Médica general con especialización en wellness.",
  whatsappNumber: "+1234567890",
} as const;

// Wait intervals
export const WAIT_INTERVALS = {
  short: 500,
  medium: 1000,
  long: 3000,
  veryLong: 5000,
} as const;

// App URLs
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
```

---

## 🔐 Authentication Helper

### `e2e/utils/auth.helper.ts`

**Key Methods:**

```typescript
class AuthHelper {
  // Login with default or custom credentials
  async login(credentials?: { email: string; password: string }): Promise<void>;

  // Logout current user
  async logout(): Promise<void>;

  // Verify user is authenticated
  async expectAuthenticated(): Promise<void>;

  // Verify user is NOT authenticated
  async expectUnauthenticated(): Promise<void>;

  // Verify error message is visible
  async expectErrorMessage(): Promise<void>;

  // Verify success message is visible
  async expectSuccessMessage(): Promise<void>;
}
```

**Features:**

- Auto-detects if form fields are pre-filled in DEV mode
- Multiple logout button selectors for resilience
- Spinner detection for loading states
- URL-based authentication verification

**Usage:**

```typescript
test("should allow editing profile", async ({ page }) => {
  const auth = createAuthHelper(page);
  await auth.login();
  await auth.expectAuthenticated();
  // ... test actions
  await auth.logout();
});
```

---

## 🗄️ Database Helper

### `e2e/utils/db.helper.ts`

**Key Methods:**

```typescript
class DatabaseHelper {
  // Reset database for clean state
  async resetDatabase(): Promise<boolean>;

  // Seed test data (requires ENABLE_TEST_ROUTES=true)
  async seedTestData(): Promise<boolean>;

  // Cleanup test data
  async cleanupTestData(): Promise<boolean>;

  // Get database status (debugging)
  async getDatabaseStatus(): Promise<Record<string, unknown> | null>;
}
```

---

## 📝 Test Specifications

### Profile Settings Tests (`config/profile.spec.ts`)

**15 tests covering:**

| Test                                        | Description                 |
| ------------------------------------------- | --------------------------- |
| should load profile editing page            | Verify page loads           |
| should display profile form fields          | Check all form fields exist |
| should update display name when valid       | Profile name update         |
| should validate display name minimum length | Validation (min 2 chars)    |
| should update professional title            | Title field update          |
| should update biography                     | Bio textarea update         |
| should update WhatsApp number               | WhatsApp field update       |
| should validate username format             | Username validation         |
| should display avatar section               | Avatar section visibility   |
| should have change photo button             | Avatar upload button        |
| should require display name                 | Required field validation   |
| should require username                     | Required field validation   |
| should have save button                     | Save button presence        |
| should display public profile               | Public profile access       |

### Settings Tests (`config/settings.spec.ts`)

**13 tests covering:**

| Test                  | Description                                |
| --------------------- | ------------------------------------------ |
| Settings Page         | Load, customization options, navigation    |
| Account Settings      | Account info, security options             |
| Preferences           | Theme changes, notification preferences    |
| Accessibility         | Accessible elements, descriptive buttons   |
| Theme Settings        | Load themes, display options, select theme |
| Social Links Settings | Load page, add link, display existing      |

### Seed Verification Tests (`config/profile-seed.spec.ts`)

**5 tests covering:**

| Test                   | Description                                 |
| ---------------------- | ------------------------------------------- |
| Profile with Seed Data | Page load after login, form fields, editing |
| Public Profile Access  | Access via URL, display content             |

---

## 🚀 Running Tests

### Prerequisites

1. **Start API with test routes enabled:**

```bash
cd packages/api
ENABLE_TEST_ROUTES=true bun run dev
```

2. **Seed the database (once before tests):**

```bash
curl -X POST http://localhost:5300/api/test/seed
```

3. **Run tests:**

```bash
cd packages/web

# All tests
bun run test

# With UI
bun run test:ui

# Specific file
bun run test tests/e2e/config/profile.spec.ts

#headed mode
bun run test --headed
```

### CI/CD

```yaml
# GitHub Actions workflow
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - name: Start API
        run: |
          cd packages/api
          ENABLE_TEST_ROUTES=true bun run dev &
          sleep 5
          curl -X POST http://localhost:5300/api/test/seed
      - name: Run tests
        run: |
          cd packages/web
          bun run test
```

---

## 🔐 Security Configuration

### Test Routes Protection

Test routes are **disabled by default** for security:

```bash
# Development (enabled)
ENABLE_TEST_ROUTES=true bun run dev

# Production (disabled - default)
bun run dev
```

**Protected endpoints:**

- `POST /api/test/seed`
- `POST /api/test/reset-db`
- `POST /api/test/cleanup`
- `GET /api/test/status`

---

## 📈 Test Metrics

| Metric           | Value     |
| ---------------- | --------- |
| Total Tests      | 34        |
| Passing          | 34 (100%) |
| Failing          | 0         |
| Execution Time   | ~1 minute |
| Parallel Workers | 3         |

---

## ✍️ Writing New Tests

### Test Template

```typescript
import { test, expect } from "../../fixtures";
import { WAIT_INTERVALS, APP_URLS } from "../fixtures/test-data";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.feature);
    await page.waitForLoadState("networkidle");
  });

  test("should perform action", async ({ authenticatedPage: { page } }) => {
    // Arrange
    const element = page.locator("selector");

    // Act
    await element.click();

    // Assert
    await expect(element).toHaveAttribute("expected", "value");
  });
});
```

### Best Practices

1. **Use fixtures:** Always use `authenticatedPage` for authenticated tests
2. **Add timeouts:** Use `WAIT_INTERVALS` for consistent waits
3. **Handle missing elements:** Use conditional checks for optional features
4. **Use semantic selectors:** Prefer `data-testid`, `name`, `role` over CSS classes
5. **Keep tests independent:** Each test should work in isolation
6. **Avoid hardcoded waits:** Use `waitForLoadState` or `waitForSelector`

---

## 📚 Related Documentation

- [Module Briefs](../modules/) - Feature specifications
- [Global PRD](../global-prd.md) - Product requirements
- [API Documentation](../modules/) - Backend endpoints

---

## 🔗 Quick Reference

| Command                                            | Description                   |
| -------------------------------------------------- | ----------------------------- |
| `bun run test`                                     | Run all E2E tests             |
| `bun run test:ui`                                  | Run tests with visual UI      |
| `ENABLE_TEST_ROUTES=true bun run dev`              | Start API with test endpoints |
| `curl -X POST http://localhost:5300/api/test/seed` | Seed database                 |
