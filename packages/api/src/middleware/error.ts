import { Elysia } from "elysia";
import { HttpException } from "../utils/http-exceptions";

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

    // Handle validation errors from Zod or Elysia
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
