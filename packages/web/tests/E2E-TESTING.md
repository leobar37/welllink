# E2E Testing with Playwright

## Description

This project uses **Playwright** for end-to-end (E2E) testing on the mediapp frontend. Playwright allows browser automation to validate that the application works correctly across different scenarios.

## Technology Stack

- **Framework**: React 19 + React Router 7 + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Playwright (@playwright/test)
- **Package Manager**: Bun

## Available Commands

### Run Tests

```bash
# Run all tests
bun run test

# Run tests with interactive UI
bun run test:ui

# View HTML test report
bun run test:report
```

### Install Browsers

```bash
# Install all browsers
npx playwright install

# Install only Chrome/Chromium
npx playwright install chromium

# Install Firefox
npx playwright install firefox

# Install WebKit (Safari)
npx playwright install webkit
```

### Generate Tests

```bash
# Generate test for a specific page
npx playwright test --generate
```

## File Structure

```
packages/web/
├── playwright.config.ts          # Main Playwright configuration
├── tests/
│   ├── E2E-TESTING.md            # This documentation
│   ├── e2e/
│   │   ├── navigation.spec.ts    # Basic navigation and UI tests
│   │   ├── features.spec.ts      # General feature tests
│   │   ├── config/
│   │   │   ├── profile.spec.ts   # Profile settings tests
│   │   │   └── settings.spec.ts  # Settings and themes tests
│   │   ├── fixtures/
│   │   │   └── test-data.ts      # Reusable test data
│   │   └── utils/
│   │       ├── auth.helper.ts    # Reusable authentication helper
│   │       └── db.helper.ts      # Database helper
│   ├── test-results/             # Test artifacts (screenshots, videos, traces)
│   └── playwright-report/        # HTML report from last execution
```

## Reusable Infrastructure

### 1. Test Data (`fixtures/test-data.ts`)

Contains reusable test data:

```typescript
import {
  TEST_CREDENTIALS,       // Test email and password
  TEST_USER_DATA,         // Data for creating users
  TEST_PROFILE_DATA,      // Test profile data
  UPDATED_PROFILE_DATA,   // Updated data for edit tests
  WAIT_INTERVALS,         # Standard wait intervals
  APP_URLS,               # Application URLs
} from "../fixtures/test-data";
```

**Usage:**

```typescript
test("should login", async ({ page }) => {
  await page.goto(APP_URLS.login);
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
});
```

### 2. Auth Helper (`utils/auth.helper.ts`)

Complete authentication helper:

```typescript
import { createAuthHelper } from "../utils/auth.helper";

test.describe("My Feature", () => {
  let auth: ReturnType<typeof createAuthHelper>;

  test.beforeEach(async ({ page }) => {
    auth = createAuthHelper(page);
    await auth.login(); // Login with test credentials
  });

  test("should do something", async () => {
    await auth.expectAuthenticated();
    // Your test here
  });
});
```

**Available methods:**

- `auth.login()` - Login with test credentials
- `auth.loginViaAPI()` - Quick login via API
- `auth.logout()` - Logout current session
- `auth.expectAuthenticated()` - Verify user is authenticated
- `auth.expectUnauthenticated()` - Verify user is NOT authenticated
- `auth.navigateToLogin()` - Navigate to login page
- `auth.expectErrorMessage()` - Verify error message is visible
- `auth.expectSuccessMessage()` - Verify success message is visible

### 3. Database Helper (`utils/db.helper.ts`)

Helper to manipulate test database:

```typescript
import { createDatabaseHelper } from "../utils/db.helper";

test.describe("My Feature", () => {
  let db: ReturnType<typeof createDatabaseHelper>;

  test.beforeEach(async ({ page }) => {
    db = createDatabaseHelper(page);
    await db.resetDatabase(); // Reset before each test
  });

  test.afterEach(async () => {
    await db.cleanupTestData(); // Cleanup after
  });
});
```

**Available methods:**

- `db.resetDatabase()` - Complete DB reset
- `db.createTestUser()` - Create a test user
- `db.cleanupTestData()` - Clean up test data
- `db.seedTestData()` - Seed initial data
- `db.getDatabaseStatus()` - Get DB status for debugging

**⚠️ Note:** Requires API endpoints in backend:

- `POST /api/test/reset-db`
- `POST /api/test/create-user`
- `POST /api/test/cleanup`
- `POST /api/test/seed`
- `GET /api/test/status`

### 4. Profile Settings Tests (`config/profile.spec.ts`)

Complete tests for profile functionality:

```typescript
import { test } from "@playwright/test";
import { createAuthHelper } from "../utils/auth.helper";
import { createDatabaseHelper } from "../utils/db.helper";
import { APP_URLS } from "../fixtures/test-data";

test.describe("Profile Settings", () => {
  let auth = createAuthHelper(page);
  let db = createDatabaseHelper(page);

  test.beforeEach(async () => {
    await db.resetDatabase();
    await auth.login();
  });

  // Profile editing tests
  test("should update display name", async () => {
    await page.goto(APP_URLS.profile);
    // ... your test
  });
});
```

**Test cases included:**

- ✅ Profile editing page load
- ✅ Form fields display
- ✅ Display name update
- ✅ Minimum length validation (2 characters)
- ✅ Professional title update
- ✅ Biography update
- ✅ WhatsApp number update
- ✅ Username format validation
- ✅ Save all profile changes
- ✅ Avatar management
- ✅ Form validation
- ✅ Loading indicator while saving

## Priority Use Cases for Testing

The following priority order is recommended for implementing E2E tests:

### 1. 🔐 Authentication (High Priority)

- Login with valid credentials
- Login with invalid credentials
- Login form validation
- Logout
- Session persistence

### 2. 👤 Profile Settings (High Priority)

- **✅ ALREADY IMPLEMENTED** in `config/profile.spec.ts`
- Basic info editing (name, title, bio)
- Unique username validation
- Avatar upload
- WhatsApp update

### 3. 🎨 Customization (Medium Priority)

- **✅ ALREADY IMPLEMENTED** in `config/settings.spec.ts`
- Theme change (light/dark)
- Colors configuration
- Fonts configuration

### 4. 🔗 Social Links (Medium Priority)

- **✅ ALREADY IMPLEMENTED** in `config/settings.spec.ts`
- Add/edit/delete links
- Link ordering
- URL validation

### 5. 📊 Dashboard (Medium Priority)

- Metrics visualization
- Section navigation
- Filters and search

### 6. 📅 Reservations (Medium Priority)

- Create reservation
- View history
- Cancel reservation

### 7. 📋 Surveys (Low Priority)

- Complete survey
- View results
- Export data

### 8. 🔗 Public Profile (Low Priority)

- Public visualization
- QR Code
- Share profile

## Configuration

### playwright.config.ts

Main configuration includes:

- **webServer**: Automatically starts Vite server (`bun run dev`) before tests
- **baseURL**: `http://localhost:5179` (configured for project)
- **projects**: Tests on Chrome, Firefox, WebKit, and mobile devices
- **reporters**: Line (console) and HTML output
- **screenshot/video/trace**: Configured to capture on failures

### Supported Browsers

| Project       | Device          | Description         |
| ------------- | --------------- | ------------------- |
| chromium      | Desktop Chrome  | Chrome for desktop  |
| firefox       | Desktop Firefox | Firefox for desktop |
| webkit        | Desktop Safari  | Safari for desktop  |
| Mobile Chrome | Pixel 5         | Android mobile      |
| Mobile Safari | iPhone 12       | iOS mobile          |

## Best Practices

### Test Naming

```typescript
test.describe("Module or Feature", () => {
  test("should [user action] when [condition]", async ({ page }) => {
    // Test implementation
  });
});
```

### Selectors

Use Playwright **locators** instead of CSS/ID selectors:

```typescript
// ✅ Recommended
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Welcome").locator("span").click();

// ❌ Avoid
await page.click("#submit-button");
await page.locator(".btn-primary").first().click();
```

### Assertions

Use Playwright `expect`:

```typescript
// Verify text
await expect(page.getByRole("heading")).toContainText("Welcome");

// Verify visibility
await expect(page.getByRole("button")).toBeVisible();

// Verify state
await expect(page.getByRole("checkbox")).toBeChecked();
```

### Waits

Playwright has auto-wait, but in specific cases:

```typescript
// Wait for navigation
await page.goto("/dashboard");
await page.waitForURL("/dashboard/**");

// Wait for element
await expect(page.getByRole("alert")).toBeVisible();

// Wait for network idle
await page.waitForLoadState("networkidle");
```

## Environment Variables

Can use `.env` files to configure tests:

```bash
# .env.test
BASE_URL=http://localhost:5179
CI=true
```

## CI/CD Integration

The `playwright.config.ts` file is configured for CI:

- `reuseExistingServer: !process.env.CI` - Reuses server locally, creates new in CI
- Artifacts (screenshots, videos) are only generated on failures
- Extended timeouts for slower environments

## Troubleshooting

### Error: Server doesn't start

Verify port 5179 is free:

```bash
lsof -i :5179
```

### Error: webServer timeout

Increase timeout in `playwright.config.ts`:

```typescript
webServer: {
  command: 'bun run dev',
  url: 'http://localhost:5179',
  timeout: 180000, // 3 minutes
}
```

### Tests fail due to dependencies

Install dependencies first:

```bash
bun install
```

## Resources

- [Playwright Official Documentation](https://playwright.dev/docs/intro)
- [Playwright with TypeScript](https://playwright.dev/docs/typescript)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
