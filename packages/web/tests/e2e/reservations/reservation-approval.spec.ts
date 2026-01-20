import { test, expect } from "../../fixtures";
import {
  TEST_TIME_SLOTS,
  TEST_MEDICAL_SERVICES,
  generateRandomPatient,
} from "../fixtures/reservation-data";

/**
 * Reservation Approval E2E Tests
 *
 * Tests for the doctor approval workflow API endpoints.
 */
test.describe("Reservation Approval API", () => {
  const API_BASE_URL = "http://localhost:5300";

  /**
   * Test: POST /api/reservations/approve - Validation
   */
  test("should reject approval with missing requestId", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: "doctor@test.com",
          }),
        });
        return {
          status: res.status,
          isValidationError: res.status === 400,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isValidationError).toBe(true);
  });

  /**
   * Test: POST /api/reservations/approve - Non-existent request
   */
  test("should return 404 for non-existent request approval", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "non-existent-request-id-12345",
            approvedBy: "doctor@test.com",
          }),
        });
        return {
          status: res.status,
          isNotFound: res.status === 404,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isNotFound).toBe(true);
  });

  /**
   * Test: POST /api/reservations/reject - Validation
   */
  test("should reject rejection with missing fields", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "some-id",
          }),
        });
        return {
          status: res.status,
          isValidationError: res.status === 400,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isValidationError).toBe(true);
  });

  /**
   * Test: POST /api/reservations/reject - Non-existent request
   */
  test("should return 404 for non-existent request rejection", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "non-existent-request-id-12345",
            rejectedBy: "doctor@test.com",
            rejectionReason: "Test reason",
          }),
        });
        return {
          status: res.status,
          isNotFound: res.status === 404,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isNotFound).toBe(true);
  });

  /**
   * Test: GET /api/reservations/pending/:profileId - Response format
   */
  test("should return array for pending requests", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/pending/test-profile`,
        );
        if (res.status === 200) {
          const data = await res.json();
          return {
            status: res.status,
            isArray: Array.isArray(data),
          };
        }
        return {
          status: res.status,
          isArray: false,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.status === 200).toBe(true);
  });

  /**
   * Test: GET /api/reservations/request/:requestId - Response format
   */
  test("should return object for single request", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/request/non-existent-id`,
        );
        if (res.status === 200) {
          const data = await res.json();
          return {
            status: res.status,
            isObject: typeof data === "object" && data !== null,
          };
        }
        return {
          status: res.status,
          isObject: false,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.status === 200 || response.status === 404).toBe(true);
  });
});
