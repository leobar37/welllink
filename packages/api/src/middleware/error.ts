import { Elysia } from "elysia";
import { HttpException } from "../utils/http-exceptions";

/**
 * Elysia validation error structure
 */
interface ElysiaValidationError {
  type: "validation";
  on: "body" | "query" | "params" | "headers";
  property?: string;
  message?: string;
  summary?: string;
  errors?: Array<{
    path: string;
    message: string;
    value?: any;
  }>;
}

/**
 * Type guard for Elysia validation errors
 */
function isElysiaValidationError(error: any): error is ElysiaValidationError {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "validation"
  );
}

export const errorMiddleware = new Elysia({ name: "error" }).onError(
  ({ error, set }) => {
    // Handle custom HttpExceptions
    if (error instanceof HttpException) {
      set.status = error.statusCode;
      return {
        error: error.message,
        code: error.code,
      };
    }

    // Handle Elysia validation errors (TypeBox/Elysia schema validation)
    if (isElysiaValidationError(error)) {
      set.status = 400;
      return {
        error: "Validation failed",
        details: error.summary || error.message || "Invalid request data",
        code: "VALIDATION_ERROR",
        field: error.property,
        on: error.on,
      };
    }

    // Handle validation errors from Zod or other libraries
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      set.status = 400;
      return {
        error: "Validation failed",
        details:
          "message" in error ? error.message : "Unknown validation error",
        code: "VALIDATION_ERROR",
      };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      console.error("Unhandled error:", error);
      set.status = 500;
      return {
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
      };
    }

    // Handle other errors
    console.error("Unknown error:", error);
    set.status = 500;
    return {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    };
  },
);
