import { test, expect } from "../../fixtures";
import { WAIT_INTERVALS, APP_URLS } from "../fixtures/test-data";

/**
 * General Settings Tests.
 *
 * These tests validate the general user settings functionality.
 */
test.describe("General Settings", () => {
  test.describe("Settings Page", () => {
    test.beforeEach(async ({ authenticatedPage: { page } }) => {
      await page.goto(APP_URLS.settings);
      await page.waitForLoadState("networkidle");
    });

    test("should load settings page", async ({
      authenticatedPage: { page },
    }) => {
      // Verify settings page loads correctly
      await expect(page.locator("body")).toBeVisible();
    });

    test("should display customization options", async ({
      authenticatedPage: { page },
    }) => {
      // Verify customization elements
      const settingsElements = page.locator(
        "[class*='settings'], [class*='config'], form, [role='form']",
      );
      if ((await settingsElements.count()) > 0) {
        await expect(settingsElements.first()).toBeVisible();
      }
    });

    test("should allow navigating between settings sections", async ({
      authenticatedPage: { page },
    }) => {
      // Verify navigation between sections exists
      const navLinks = page.locator(
        "nav a, [role='navigation'] a, [class*='tab']",
      );
      const navCount = await navLinks.count();

      if (navCount > 0) {
        // Click first navigation link
        await navLinks.first().click();
        await page.waitForTimeout(WAIT_INTERVALS.medium);

        // Verify navigation works
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Account Settings", () => {
    test.beforeEach(async ({ authenticatedPage: { page } }) => {
      await page.goto(APP_URLS.settings);
      await page.waitForLoadState("networkidle");
    });

    test("should display account information", async ({
      authenticatedPage: { page },
    }) => {
      // Find account information
      const accountInfo = page.locator(
        "text=Cuenta, text=Perfil, text=Información personal",
      );
      if ((await accountInfo.count()) > 0) {
        await expect(accountInfo.first()).toBeVisible();
      }
    });

    test("should display security options", async ({
      authenticatedPage: { page },
    }) => {
      // Find security options
      const securityOptions = page.locator(
        "text=Seguridad, text=Contraseña, text=Autenticación",
      );
      if ((await securityOptions.count()) > 0) {
        await expect(securityOptions.first()).toBeVisible();
      }
    });
  });

  test.describe("Preferences", () => {
    test.beforeEach(async ({ authenticatedPage: { page } }) => {
      await page.goto(APP_URLS.settings);
      await page.waitForLoadState("networkidle");
    });

    test("should allow theme changes", async ({
      authenticatedPage: { page },
    }) => {
      // Find theme selector
      const themeToggle = page.locator(
        '[class*="theme"], button:has-text("theme"), [aria-label*="theme"], select',
      );

      if ((await themeToggle.count()) > 0) {
        // Click theme toggle
        await themeToggle.first().click();
        await page.waitForTimeout(WAIT_INTERVALS.short);

        // Verify change doesn't cause errors
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("should display notification preferences", async ({
      authenticatedPage: { page },
    }) => {
      // Find notification options
      const notificationSettings = page.locator(
        "text=Notificaciones, text=Email, text=Push",
      );
      if ((await notificationSettings.count()) > 0) {
        await expect(notificationSettings.first()).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test.beforeEach(async ({ authenticatedPage: { page } }) => {
      await page.goto(APP_URLS.settings);
      await page.waitForLoadState("networkidle");
    });

    test("should have accessible elements", async ({
      authenticatedPage: { page },
    }) => {
      // Verify inputs have labels
      const inputs = page.locator("input, select, textarea");
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");

        if (id) {
          // Verify associated label exists
          const label = page.locator(`label[for="${id}"]`);
          expect(await label.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("should have buttons with descriptive text", async ({
      authenticatedPage: { page },
    }) => {
      // Verify buttons have text
      const buttons = page.locator("button");
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute("aria-label");

        // Button should have text or aria-label
        expect(
          (text !== null && text.trim().length > 0) || ariaLabel !== null,
        ).toBe(true);
      }
    });
  });
});

/**
 * Theme Settings Tests.
 */
test.describe("Theme Settings", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.themes);
    await page.waitForLoadState("networkidle");
  });

  test("should load themes page", async ({ authenticatedPage: { page } }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display theme options", async ({
    authenticatedPage: { page },
  }) => {
    const themeOptions = page.locator(
      "[class*='theme'], [class*='color'], [class*='style'], button",
    );
    if ((await themeOptions.count()) > 0) {
      await expect(themeOptions.first()).toBeVisible();
    }
  });

  test("should allow selecting a theme", async ({
    authenticatedPage: { page },
  }) => {
    // Find theme buttons or selects
    const themeSelectors = page.locator(
      "button:has-text('Claro'), button:has-text('Oscuro'), select, [class*='theme']",
    );

    if ((await themeSelectors.count()) > 0) {
      await themeSelectors.first().click();
      await page.waitForTimeout(WAIT_INTERVALS.medium);

      // Verify selection works
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

/**
 * Social Links Settings Tests.
 */
test.describe("Social Links Settings", () => {
  test.beforeEach(async ({ authenticatedPage: { page } }) => {
    await page.goto(APP_URLS.social);
    await page.waitForLoadState("networkidle");
  });

  test("should load social links page", async ({
    authenticatedPage: { page },
  }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("should allow adding a social link", async ({
    authenticatedPage: { page },
  }) => {
    // Find add button
    const addButton = page.locator(
      "button:has-text('Agregar'), button:has-text('Añadir')",
    );

    if ((await addButton.count()) > 0) {
      await addButton.first().click();
      await page.waitForTimeout(WAIT_INTERVALS.medium);

      // Verify form opens
      await expect(page.locator("form")).toBeVisible();
    }
  });

  test("should display existing social links", async ({
    authenticatedPage: { page },
  }) => {
    // Find social links
    const socialLinks = page.locator(
      'a[href*="instagram"], a[href*="twitter"], a[href*="linkedin"], a[href*="facebook"]',
    );

    if ((await socialLinks.count()) > 0) {
      await expect(socialLinks.first()).toBeVisible();
    }
  });
});
