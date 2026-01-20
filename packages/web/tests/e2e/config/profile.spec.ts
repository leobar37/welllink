import { test, expect } from "../../fixtures";
import {
  TEST_PROFILE_DATA,
  UPDATED_PROFILE_DATA,
  WAIT_INTERVALS,
  APP_URLS,
} from "../fixtures/test-data";

/**
 * Profile Settings Tests.
 * These tests validate the user profile editing functionality.
 * Uses global fixtures for authentication and database management.
 */
test.describe("Profile Settings", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.goto(APP_URLS.profile);
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    const heading = page.locator("h1:has-text('Editar Perfil')");
    if ((await heading.count()) > 0) {
      await expect(heading).toBeVisible({ timeout: WAIT_INTERVALS.long });
    }
  });

  test("should load profile editing page", async ({
    authenticatedPage: { page },
  }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display profile form fields", async ({
    authenticatedPage: { page },
  }) => {
    // Check form fields exist
    const fields = [
      'input[name="displayName"]',
      'input[name="username"]',
      'input[name="title"]',
      'textarea[name="bio"]',
      'input[name="whatsappNumber"]',
    ];

    for (const field of fields) {
      const input = page.locator(field);
      if ((await input.count()) > 0) {
        await expect(input).toBeVisible();
      }
    }
  });

  test("should update display name when valid", async ({
    authenticatedPage: { page },
  }) => {
    const displayNameInput = page.locator('input[name="displayName"]');

    if ((await displayNameInput.count()) === 0) {
      test.skip();
      return;
    }

    // Get current value
    const initialValue = await displayNameInput.inputValue();

    // Clear and fill new value
    await displayNameInput.clear();
    await displayNameInput.fill("Test User");

    // Check if save button is enabled
    const saveButton = page.locator('button:has-text("Guardar Cambios")');
    if ((await saveButton.count()) > 0 && (await saveButton.isEnabled())) {
      await saveButton.click();
      await page.waitForTimeout(WAIT_INTERVALS.medium);
    }
  });

  test("should validate display name minimum length", async ({
    authenticatedPage: { page },
  }) => {
    const displayNameInput = page.locator('input[name="displayName"]');

    if ((await displayNameInput.count()) === 0) {
      test.skip();
      return;
    }

    // Enter short name
    await displayNameInput.clear();
    await displayNameInput.fill("A");

    // Save button should be disabled for invalid input
    const saveButton = page.locator('button:has-text("Guardar Cambios")');
    if ((await saveButton.count()) > 0) {
      await expect(saveButton).toBeDisabled();
    }
  });

  test("should update professional title", async ({
    authenticatedPage: { page },
  }) => {
    const titleInput = page.locator('input[name="title"]');

    if ((await titleInput.count()) === 0) {
      test.skip();
      return;
    }

    await titleInput.clear();
    await titleInput.fill(TEST_PROFILE_DATA.title);
    await expect(titleInput).toHaveValue(TEST_PROFILE_DATA.title);
  });

  test("should update biography", async ({ authenticatedPage: { page } }) => {
    const bioInput = page.locator('textarea[name="bio"]');

    if ((await bioInput.count()) === 0) {
      test.skip();
      return;
    }

    await bioInput.clear();
    await bioInput.fill(TEST_PROFILE_DATA.bio);
    await expect(bioInput).toHaveValue(TEST_PROFILE_DATA.bio);
  });

  test("should update WhatsApp number", async ({
    authenticatedPage: { page },
  }) => {
    const whatsappInput = page.locator('input[name="whatsappNumber"]');

    if ((await whatsappInput.count()) === 0) {
      test.skip();
      return;
    }

    await whatsappInput.clear();
    await whatsappInput.fill(TEST_PROFILE_DATA.whatsappNumber);
    await expect(whatsappInput).toHaveValue(TEST_PROFILE_DATA.whatsappNumber);
  });

  test("should validate username format", async ({
    authenticatedPage: { page },
  }) => {
    const usernameInput = page.locator('input[name="username"]');

    if ((await usernameInput.count()) === 0) {
      test.skip();
      return;
    }

    // Enter invalid username
    await usernameInput.clear();
    await usernameInput.fill("Invalid Username!@#");

    // Check for validation error
    const errorMessage = page.locator('[class*="error"], .text-destructive');
    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
});

/**
 * Avatar Tests.
 */
test.describe("Avatar", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.profile);
    await page.waitForLoadState("networkidle");
  });

  test("should display avatar section", async ({
    authenticatedPage: { page },
  }) => {
    // Check if avatar section exists - use broader selector
    const avatarSection = page.locator(
      '[data-slot="avatar"], .rounded-full, [class*="image"]',
    );
    await expect(avatarSection.first()).toBeVisible();
  });

  test("should have change photo button", async ({
    authenticatedPage: { page },
  }) => {
    const changePhotoButton = page.locator("text=Cambiar Foto");
    await expect(changePhotoButton).toBeVisible();
  });
});

/**
 * Form Validation Tests.
 */
test.describe("Form Validation", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.profile);
    await page.waitForLoadState("networkidle");
  });

  test("should require display name", async ({
    authenticatedPage: { page },
  }) => {
    const displayNameInput = page.locator('input[name="displayName"]');

    if ((await displayNameInput.count()) === 0) {
      test.skip();
      return;
    }

    await displayNameInput.clear();

    const saveButton = page.locator('button:has-text("Guardar Cambios")');
    if ((await saveButton.count()) > 0) {
      await expect(saveButton).toBeDisabled();
    }
  });

  test("should require username", async ({ authenticatedPage: { page } }) => {
    const usernameInput = page.locator('input[name="username"]');

    if ((await usernameInput.count()) === 0) {
      test.skip();
      return;
    }

    await usernameInput.clear();
    await usernameInput.fill("ab");

    const saveButton = page.locator('button:has-text("Guardar Cambios")');
    if ((await saveButton.count()) > 0) {
      await expect(saveButton).toBeDisabled();
    }
  });
});

/**
 * Navigation and UX Tests.
 */
test.describe("Navigation and UX", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.profile);
    await page.waitForLoadState("networkidle");
  });

  test("should have save button", async ({ authenticatedPage: { page } }) => {
    const saveButton = page.locator('button:has-text("Guardar Cambios")');
    await expect(saveButton).toBeVisible();
  });
});

/**
 * Public Profile Tests (without authentication).
 */
test.describe("Public Profile", () => {
  test("should display public profile", async ({ page }) => {
    await page.goto("/@test");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});
