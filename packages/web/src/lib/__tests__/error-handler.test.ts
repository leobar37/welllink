import { describe, it, expect } from "bun:test";
import {
  extractErrorMessage,
  getErrorStatus,
  isValidationError,
  isAuthError,
  isNotFoundError,
  isConflictError,
} from "../error-handler";

describe("error-handler", () => {
  describe("extractErrorMessage", () => {
    it("should extract message from Elysia validation error", () => {
      const error = {
        status: 400,
        value: {
          type: "validation",
          on: "body",
          property: "/username",
          message: "Expected string to match '^[a-z0-9-]+$'",
          summary: "Expected string to match '^[a-z0-9-]+$'",
        },
      };

      const message = extractErrorMessage(error);
      expect(message).toContain("Validation error");
      expect(message).toContain("Expected string to match");
    });

    it("should extract message from backend error format", () => {
      const error = {
        status: 400,
        value: {
          error: "Validation failed",
          details:
            "Username can only contain lowercase letters, numbers, and hyphens",
          code: "VALIDATION_ERROR",
        },
      };

      const message = extractErrorMessage(error);
      expect(message).toBe(
        "Username can only contain lowercase letters, numbers, and hyphens",
      );
    });

    it("should extract message from HttpException", () => {
      const error = {
        status: 404,
        value: {
          error: "Profile not found",
          code: "NOT_FOUND",
        },
      };

      const message = extractErrorMessage(error);
      expect(message).toBe("Profile not found");
    });

    it("should use fallback message for unknown errors", () => {
      const error = {
        status: 500,
        value: null,
      };

      const message = extractErrorMessage(error, "Something went wrong");
      expect(message).toBe("Something went wrong");
    });

    it("should handle standard Error objects", () => {
      const error = new Error("Connection failed");
      const message = extractErrorMessage(error);
      expect(message).toBe("Connection failed");
    });

    it("should handle string value", () => {
      const error = {
        status: 400,
        value: "Invalid input",
      };

      const message = extractErrorMessage(error);
      expect(message).toBe("Invalid input");
    });
  });

  describe("getErrorStatus", () => {
    it("should extract status from eden error", () => {
      const error = {
        status: 404,
        value: { error: "Not found" },
      };

      expect(getErrorStatus(error)).toBe(404);
    });

    it("should return undefined for non-eden errors", () => {
      const error = new Error("Something went wrong");
      expect(getErrorStatus(error)).toBeUndefined();
    });
  });

  describe("isValidationError", () => {
    it("should return true for 400 status", () => {
      const error = { status: 400, value: {} };
      expect(isValidationError(error)).toBe(true);
    });

    it("should return true for 422 status", () => {
      const error = { status: 422, value: {} };
      expect(isValidationError(error)).toBe(true);
    });

    it("should return false for other statuses", () => {
      const error = { status: 500, value: {} };
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe("isAuthError", () => {
    it("should return true for 401 status", () => {
      const error = { status: 401, value: {} };
      expect(isAuthError(error)).toBe(true);
    });

    it("should return false for other statuses", () => {
      const error = { status: 403, value: {} };
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe("isNotFoundError", () => {
    it("should return true for 404 status", () => {
      const error = { status: 404, value: {} };
      expect(isNotFoundError(error)).toBe(true);
    });

    it("should return false for other statuses", () => {
      const error = { status: 400, value: {} };
      expect(isNotFoundError(error)).toBe(false);
    });
  });

  describe("isConflictError", () => {
    it("should return true for 409 status", () => {
      const error = { status: 409, value: {} };
      expect(isConflictError(error)).toBe(true);
    });

    it("should return false for other statuses", () => {
      const error = { status: 400, value: {} };
      expect(isConflictError(error)).toBe(false);
    });
  });
});
