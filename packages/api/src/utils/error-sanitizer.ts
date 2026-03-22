const SENSITIVE_PATTERNS = [
  /password/gi,
  /secret/gi,
  /api[_-]?key/gi,
  /token/gi,
  /credential/gi,
  /private/gi,
  /database/gi,
  /connection/gi,
  /sql/gi,
  /query/gi,
  /internal/gi,
  /stack/gi,
  /at\s+\w+\.\w+/gi,
  /\(.+:\d+:\d+\)/gi,
  /file:\/\/.*/gi,
  /\/[\w/]+\/[\w/]+\.(ts|js|tsx|jsx)/gi,
];

const GENERIC_MESSAGES: Record<string, string> = {
  database: "Database operation failed",
  connection: "Connection error occurred",
  timeout: "Operation timed out",
  not_found: "Resource not found",
  invalid: "Invalid input provided",
  unauthorized: "Authentication required",
  forbidden: "Access denied",
  unknown: "An unexpected error occurred",
};

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;

    // Check for sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(message)) {
        // Try toget a generic message based on error type
        for (const [key, generic] of Object.entries(GENERIC_MESSAGES)) {
          if (message.toLowerCase().includes(key)) {
            return generic;
          }
        }
        return GENERIC_MESSAGES.unknown;
      }
    }

    // Truncate very long messages
    if (message.length > 200) {
      message = message.substring(0, 200) + "...";
    }

    return message;
  }

  if (typeof error === "string") {
    // Apply same sanitization to string errors
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(error)) {
        return GENERIC_MESSAGES.unknown;
      }
    }
    if (error.length > 200) {
      return error.substring(0, 200) + "...";
    }
    return error;
  }

  return GENERIC_MESSAGES.unknown;
}

export function createErrorResponse(error: unknown): {
  error: true;
  message: string;
} {
  return {
    error: true,
    message: sanitizeErrorMessage(error),
  };
}
