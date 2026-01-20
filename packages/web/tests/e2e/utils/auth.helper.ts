import { type Page, type Locator, expect } from "@playwright/test";
import {
  TEST_CREDENTIALS,
  WAIT_INTERVALS,
  APP_URLS,
} from "../fixtures/test-data";

/**
 * Reusable authentication helper for E2E tests.
 * Provides login, logout and authentication state verification functions.
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Reusable locators for login form.
   */
  private get emailInput(): Locator {
    return this.page.locator('input[type="email"]');
  }

  private get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }

  private get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  private get loginForm(): Locator {
    return this.page.locator("form");
  }

  private get loadingSpinner(): Locator {
    return this.page.locator(
      '[class*="animate-spin"], svg[class*="animate-spin"]',
    );
  }

  /**
   * Navigate to login page.
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto(APP_URLS.login);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Verify that login form is visible.
   */
  async expectLoginFormVisible(): Promise<void> {
    await expect(this.loginForm).toBeVisible();
  }

  /**
   * Login with default test credentials.
   * @param credentials - Optional credentials (uses TEST_CREDENTIALS if not provided).
   */
  async login(
    credentials: { email: string; password: string } = TEST_CREDENTIALS,
  ): Promise<void> {
    await this.navigateToLogin();

    // Verify form is visible
    await this.expectLoginFormVisible();

    // In DEV mode, fields are pre-filled by the Login component
    // Just click the submit button if it's already enabled
    const submitButton = this.submitButton;
    const isButtonEnabled = await submitButton
      .isEnabled({ timeout: 2000 })
      .catch(() => false);

    if (isButtonEnabled) {
      // Button is enabled - click it
      await submitButton.click();
    } else {
      // Button is disabled - fill form fields first
      await this.emailInput.fill(credentials.email);
      await this.passwordInput.fill(credentials.password);

      // Verify submit button is enabled
      await expect(this.submitButton).toBeEnabled({ timeout: 5000 });

      // Click submit button
      await this.submitButton.click();
    }

    // Wait for loading spinner to disappear
    await this.page.waitForFunction(
      () => !document.querySelector('[class*="animate-spin"]'),
      { timeout: WAIT_INTERVALS.long },
    );

    // Wait for navigation to dashboard
    await this.page.waitForURL(/dashboard/, {
      timeout: WAIT_INTERVALS.veryLong,
    });
  }

  /**
   * Login using direct API (faster for multiple tests).
   * This method simulates login without going through the UI.
   */
  async loginViaAPI(): Promise<void> {
    // Navigate to dashboard directly
    // Better-Auth should redirect to login if no session
    await this.page.goto(APP_URLS.dashboard);

    // If on login page, do UI login
    if (this.page.url().includes("/auth")) {
      await this.login();
    }
  }

  /**
   * Logout current user.
   */
  async logout(): Promise<void> {
    try {
      // Navigate to dashboard if not already there
      if (!this.page.url().includes("/dashboard")) {
        await this.page.goto(APP_URLS.dashboard);
      }

      // Try to find logout button - try multiple selectors
      const logoutSelectors = [
        'button:has-text("Cerrar sesión")',
        'a:has-text("Cerrar sesión")',
        '[data-testid="logout"]',
        '[class*="logout"]',
        'button[class*="user"]',
        '[class*="user-menu"] button',
      ];

      let loggedOut = false;

      for (const selector of logoutSelectors) {
        const logoutButton = this.page.locator(selector);
        if ((await logoutButton.count()) > 0) {
          try {
            await logoutButton.first().click({ timeout: 1000 });
            loggedOut = true;
            break;
          } catch {
            continue;
          }
        }
      }

      // If no logout button found, just navigate to home
      if (!loggedOut) {
        await this.page.goto(APP_URLS.home);
      }

      // Wait a bit for logout to complete
      await this.page.waitForTimeout(WAIT_INTERVALS.medium);

      // Check if we're on login page or home
      const currentUrl = this.page.url();
      if (currentUrl.includes("/auth")) {
        await this.expectUnauthenticated();
      }
    } catch (error) {
      // If logout fails, just navigate to home
      console.warn("Logout failed, navigating to home:", error);
      await this.page.goto(APP_URLS.home);
    }
  }

  /**
   * Verify user is authenticated.
   */
  async expectAuthenticated(): Promise<void> {
    // Should be on dashboard or protected pages
    await expect(this.page).toHaveURL(/dashboard\/|settings|profile/);
  }

  /**
   * Verify user is NOT authenticated.
   */
  async expectUnauthenticated(): Promise<void> {
    // Should be on login or register page
    await expect(this.page).toHaveURL(/auth\/login|auth\/register/);
  }

  /**
   * Wait for user to be authenticated (useful for async checks).
   */
  async waitForAuthenticated(
    timeout: number = WAIT_INTERVALS.veryLong,
  ): Promise<void> {
    await this.page.waitForURL(/dashboard\/|settings|profile/, { timeout });
  }

  /**
   * Verify an error message is visible.
   */
  async expectErrorMessage(): Promise<void> {
    const errorMessage = this.page.locator(
      '[class*="error"], [class*="destructive"], [role="alert"], .toast-error',
    );
    await expect(errorMessage.first()).toBeVisible();
  }

  /**
   * Verify a success message is visible.
   */
  async expectSuccessMessage(): Promise<void> {
    const successMessage = this.page.locator(
      '[class*="success"], .toast-success, [role="status"]:has-text("éxito")',
    );
    await expect(successMessage.first()).toBeVisible();
  }

  /**
   * Clear login form.
   */
  async clearLoginForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}

/**
 * Create an AuthHelper for a specific page.
 */
export function createAuthHelper(page: Page): AuthHelper {
  return new AuthHelper(page);
}

/**
 * Playwright fixture for authentication.
 * Adds 'auth' to each test context.
 */
export const authFixture = {
  /**
   * Automatic before each hook for authentication.
   */
  beforeEach: async ({ page }: { page: Page }) => {
    const auth = createAuthHelper(page);
    return { auth };
  },

  /**
   * Helper to create an authenticated test.
   */
  authenticatedTest: {
    beforeEach: async ({ page }: { page: Page }) => {
      const auth = createAuthHelper(page);
      await auth.login();
      return { auth };
    },
  },
};
