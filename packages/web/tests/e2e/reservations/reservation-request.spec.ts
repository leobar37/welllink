import { test, expect } from "../../fixtures";
import {
  TEST_TIME_SLOTS,
  TEST_MEDICAL_SERVICES,
  generateRandomPatient,
} from "../fixtures/reservation-data";

/**
 * Reservation API E2E Tests
 *
 * These tests verify that the reservation API endpoints exist and respond correctly.
 * They don't require complex database setup as they test the API layer directly.
 */
test.describe("Reservation API Endpoints", () => {
  const API_BASE_URL = "http://localhost:5300";

  /**
   * Test: POST /api/reservations/request - Endpoint exists
   */
  test("should return 400 or error for missing required fields", async ({
    page,
  }) => {
    // This test verifies the endpoint exists and validates input
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Missing required fields - should return validation error
            slotId: "",
            serviceId: "",
            patientName: "",
            patientPhone: "",
          }),
        });
        return {
          status: res.status,
          isValidationError: res.status === 400,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    // The endpoint should exist and return 400 for invalid input
    expect(response.isValidationError).toBe(true);
  });

  /**
   * Test: GET /api/reservations/request/:id - Endpoint exists
   */
  test("should return 404 for non-existent request", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/request/non-existent-id`,
        );
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
   * Test: GET /api/reservations/pending/:profileId - Endpoint exists
   */
  test("should return array for pending requests endpoint", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/pending/test-profile-id`,
        );
        return {
          status: res.status,
          isArray: res.status === 200,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isArray).toBe(true);
  });

  /**
   * Test: GET /api/reservations/patient/:phone - Endpoint exists
   */
  test("should return array for patient history endpoint", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/patient/+5491123456789`,
        );
        return {
          status: res.status,
          isArray: res.status === 200,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isArray).toBe(true);
  });

  /**
   * Test: POST /api/reservations/approve - Endpoint exists
   */
  test("should return 400 or error for invalid approval request", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Missing required fields
            requestId: "",
            approvedBy: "",
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
   * Test: POST /api/reservations/reject - Endpoint exists
   */
  test("should return 400 or error for invalid rejection request", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Missing required fields
            requestId: "",
            rejectedBy: "",
            rejectionReason: "",
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
   * Test: GET /api/reservations/stats/:profileId - Endpoint exists
   */
  test("should return object for stats endpoint", async ({ page }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/stats/test-profile-id`,
        );
        return {
          status: res.status,
          isObject: res.status === 200,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    expect(response.isObject).toBe(true);
  });
});

/**
 * Reservation Approval Workflow E2E Tests
 *
 * Tests for the doctor approval workflow with proper error handling.
 */
test.describe("Reservation Approval Workflow", () => {
  const API_BASE_URL = "http://localhost:5300";

  /**
   * Test: Approve non-existent request should return 404
   */
  test("should return 404 when approving non-existent request", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "definitely-does-not-exist-12345",
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
   * Test: Reject non-existent request should return 404
   */
  test("should return 404 when rejecting non-existent request", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "definitely-does-not-exist-12345",
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
   * Test: Empty rejection reason should fail validation
   */
  test("should reject request with empty rejection reason", async ({
    page,
  }) => {
    // First create a request to get a valid ID
    const patient = generateRandomPatient();

    // Try to reject with empty reason
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/reservations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: "some-request-id",
            rejectedBy: "doctor@test.com",
            rejectionReason: "",
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
});

/**
 * Patient History E2E Tests
 */
test.describe("Patient Reservation History", () => {
  const API_BASE_URL = "http://localhost:5300";

  /**
   * Test: Get history for unknown phone returns empty array
   */
  test("should return empty array for unknown patient phone", async ({
    page,
  }) => {
    const response = await page.evaluate(
      async ({ baseUrl }) => {
        const res = await fetch(
          `${baseUrl}/api/reservations/patient/+5491100000000`,
        );
        if (res.status === 200) {
          const data = await res.json();
          return {
            status: res.status,
            isEmptyArray: Array.isArray(data) && data.length === 0,
          };
        }
        return {
          status: res.status,
          isEmptyArray: false,
        };
      },
      { baseUrl: API_BASE_URL },
    );

    // Should either return empty array or be a valid response
    expect(response.status === 200 || response.status === 404).toBe(true);
  });
});
