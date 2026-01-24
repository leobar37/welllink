import { chatResponseSchema, type AIMessagePart } from "./schema";
import type { ZodError } from "zod";

interface ParseResult {
  parts: AIMessagePart[];
  errors: ParseError[];
}

interface ParseError {
  type: "json-parse" | "schema-validation";
  message: string;
  context: string;
}

/**
 * Parse structured JSON from agent response text
 * Extracts JSON blocks from markdown code fences and parses them
 */
export function parseStructuredResponse(text: string): ParseResult {
  const parts: AIMessagePart[] = [];
  const errors: ParseError[] = [];

  // Pattern to match JSON blocks in markdown format: ```json ... ```
  const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/g;

  let lastIndex = 0;
  let match;
  let blockIndex = 0;

  while ((match = jsonBlockPattern.exec(text)) !== null) {
    blockIndex++;

    // Add any text before this JSON block as a text part
    const textBefore = text.slice(lastIndex, match.index).trim();
    if (textBefore) {
      parts.push({
        type: "text",
        text: textBefore,
      });
    }

    // Parse the JSON block
    try {
      const jsonContent = JSON.parse(match[1]);

      // Validate against schema
      const result = chatResponseSchema.safeParse(jsonContent);

      if (result.success) {
        // Add all parts from the JSON response
        parts.push(...result.data.parts);
      } else {
        // If validation fails, log detailed error and add raw JSON as text
        const errorDetail = formatZodError(result.error);
        const error: ParseError = {
          type: "schema-validation",
          message: errorDetail,
          context: `JSON block #${blockIndex}`,
        };
        errors.push(error);

        console.warn(
          `[AI Parser] Schema validation failed in block #${blockIndex}:`,
          errorDetail,
        );

        parts.push({
          type: "text",
          text: match[1].trim(),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const parseError: ParseError = {
        type: "json-parse",
        message: errorMessage,
        context: `JSON block #${blockIndex}`,
      };
      errors.push(parseError);

      console.warn(
        `[AI Parser] Failed to parse JSON block #${blockIndex}:`,
        errorMessage,
      );

      parts.push({
        type: "text",
        text: match[1].trim(),
      });
    }

    lastIndex = jsonBlockPattern.lastIndex;
  }

  // Add any remaining text after the last JSON block
  const textAfter = text.slice(lastIndex).trim();
  if (textAfter) {
    parts.push({
      type: "text",
      text: textAfter,
    });
  }

  // If no JSON blocks were found, return the entire text as a text part
  if (parts.length === 0 && text.trim()) {
    parts.push({
      type: "text",
      text: text.trim(),
    });
  }

  return { parts, errors };
}

/**
 * Format Zod validation errors into a readable string
 */
function formatZodError(error: ZodError<unknown>): string {
  const issues = error.issues.map((e) => {
    const path = e.path.length > 0 ? e.path.join(".") : "root";
    return `${path}: ${e.message}`;
  });
  return issues.join("; ");
}

/**
 * Extract just the parts from a parse result (for backward compatibility)
 */
export function extractParts(result: ParseResult): AIMessagePart[] {
  return result.parts;
}

/**
 * Get parse errors from the last parse operation
 */
export function getParseErrors(result: ParseResult): ParseError[] {
  return result.errors;
}

/**
 * Check if parse result has any errors
 */
export function hasParseErrors(result: ParseResult): boolean {
  return result.errors.length > 0;
}

/**
 * Check if a response contains structured JSON
 */
export function hasStructuredResponse(text: string): boolean {
  const jsonBlockPattern = /```json\s*[\s\S]*?\s*```/;
  return jsonBlockPattern.test(text);
}

/**
 * Extract and validate structured parts from response
 * Returns null if no valid structured data found
 */
export function extractStructuredParts(text: string): AIMessagePart[] | null {
  if (!hasStructuredResponse(text)) {
    return null;
  }

  const result = parseStructuredResponse(text);
  return result.parts;
}
