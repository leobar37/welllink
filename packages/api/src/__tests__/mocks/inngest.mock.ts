/**
 * Mock Inngest client for unit testing.
 * This module provides a mock implementation of sendMedicalEvent
 * that doesn't require actual API calls.
 */

// Track all events sent during tests for verification
export const sentEvents: Array<{
  name: string;
  data: Record<string, unknown>;
}> = [];

let mockEnabled = false;

/**
 * Enable mock mode - all calls will be tracked and return success
 */
export function enableMock(): void {
  mockEnabled = true;
  sentEvents.length = 0;
}

/**
 * Disable mock mode - will throw if called without proper setup
 */
export function disableMock(): void {
  mockEnabled = false;
}

/**
 * Mock implementation of sendMedicalEvent
 * Records the event and returns success without calling the actual API
 */
export async function sendMedicalEvent(
  name: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean }> {
  if (mockEnabled) {
    sentEvents.push({ name, data });
    return { success: true };
  }

  // If not in mock mode, return success anyway for tests
  // In a real scenario, this would call the Inngest API
  return { success: true };
}

/**
 * Get all events sent during the current mock session
 */
export function getSentEvents(): Array<{
  name: string;
  data: Record<string, unknown>;
}> {
  return [...sentEvents];
}

/**
 * Clear all recorded events
 */
export function clearSentEvents(): void {
  sentEvents.length = 0;
}

/**
 * Check if a specific event was sent
 */
export function wasEventSent(eventName: string): boolean {
  return sentEvents.some((e) => e.name === eventName);
}

/**
 * Get events by name
 */
export function getEventsByName(eventName: string): Array<{
  name: string;
  data: Record<string, unknown>;
}> {
  return sentEvents.filter((e) => e.name === eventName);
}
