/**
 * Error Handler Utility for Eden Treaty
 *
 * Provides consistent error extraction from backend responses across the app.
 * Works with Elysia's validation errors and custom HttpExceptions.
 */

/**
 * Structure of errors returned by eden treaty
 */
interface EdenError {
  status: number;
  value: any;
}

/**
 * Backend error response format (from errorMiddleware)
 */
interface BackendError {
  error?: string;
  code?: string;
  details?: string;
  message?: string;
}

/**
 * Elysia validation error format (when validation fails before middleware)
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
 * Extracts a user-friendly error message from an eden treaty error
 *
 * @param error - The error object from eden treaty (can be any type)
 * @param fallback - Default message if no specific error can be extracted
 * @returns A user-friendly error message
 *
 * @example
 * // In a mutation onError handler:
 * onError: (err) => {
 *   const message = extractErrorMessage(err, "Failed to update profile");
 *   toast.error(message);
 * }
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An error occurred",
): string {
  if (!error) return fallback;

  // If it's a standard Error object
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // If it's an eden treaty error with status and value
  if (isEdenError(error)) {
    const { value } = error;

    // Check if it's an Elysia validation error (raw format from Elysia)
    if (isElysiaValidationError(value)) {
      return formatValidationError(value);
    }

    // Check if it's our backend error format (from errorMiddleware)
    if (isBackendError(value)) {
      return value.details || value.error || value.message || fallback;
    }

    // If value is a string
    if (typeof value === "string") {
      return value;
    }

    // If value has a message property
    if (value && typeof value === "object" && "message" in value) {
      return String(value.message);
    }

    // Try to stringify if it's an object
    if (value && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
  }

  return fallback;
}

/**
 * Formats an Elysia validation error into a user-friendly message
 */
function formatValidationError(error: ElysiaValidationError): string {
  // Use summary if available (most user-friendly)
  if (error.summary) {
    return `Validation error: ${error.summary}`;
  }

  // Use message if available
  if (error.message) {
    return `Validation error: ${error.message}`;
  }

  // Format specific errors if available
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    return `Validation error on ${firstError.path}: ${firstError.message}`;
  }

  // Generic validation error
  return `Validation error on ${error.on}${error.property ? ` (${error.property})` : ""}`;
}

/**
 * Type guard for eden treaty errors
 */
function isEdenError(error: unknown): error is EdenError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "value" in error &&
    typeof (error as any).status === "number"
  );
}

/**
 * Type guard for backend error format
 */
function isBackendError(value: unknown): value is BackendError {
  return (
    typeof value === "object" &&
    value !== null &&
    ("error" in value ||
      "code" in value ||
      "details" in value ||
      "message" in value)
  );
}

/**
 * Type guard for Elysia validation errors
 */
function isElysiaValidationError(
  value: unknown,
): value is ElysiaValidationError {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as any).type === "validation"
  );
}

/**
 * Gets the HTTP status code from an error
 *
 * @param error - The error object
 * @returns The status code or undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isEdenError(error)) {
    return error.status;
  }
  return undefined;
}

/**
 * Checks if an error is a validation error (400 or 422)
 */
export function isValidationError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 400 || status === 422;
}

/**
 * Checks if an error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

/**
 * Checks if an error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

/**
 * Checks if an error is a conflict error (409)
 */
export function isConflictError(error: unknown): boolean {
  return getErrorStatus(error) === 409;
}
