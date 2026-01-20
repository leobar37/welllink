import { Inngest } from "inngest";
import type { MedicalReservationEvents } from "../types/inngest-events";
import { env } from "../config/env";

// Mock mode for testing - when enabled, events are logged but not sent
let mockMode = false;
const sentEvents: Array<{ name: string; data: unknown }> = [];

/**
 * Enable mock mode for testing - events are tracked but not sent to Inngest API
 */
export function enableMockMode(): void {
  mockMode = true;
  sentEvents.length = 0;
}

/**
 * Disable mock mode
 */
export function disableMockMode(): void {
  mockMode = false;
}

/**
 * Get all events sent in mock mode
 */
export function getMockSentEvents(): Array<{ name: string; data: unknown }> {
  return [...sentEvents];
}

/**
 * Clear mock event history
 */
export function clearMockEvents(): void {
  sentEvents.length = 0;
}

export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  name: "Medical Chatbot Platform",
  eventKey: env.INNGEST_EVENT_KEY,
  baseUrl:
    env.NODE_ENV === "development"
      ? env.INNGEST_DEV_SERVER_URL
      : env.INNGEST_BASE_URL,
});

export const sendMedicalEvent = async <
  T extends keyof MedicalReservationEvents,
>(
  eventName: T,
  data: MedicalReservationEvents[T]["data"],
) => {
  // In mock mode, just track the event and return success
  if (mockMode) {
    sentEvents.push({ name: eventName, data });
    return { success: true, ids: [`mock-${Date.now()}`] };
  }

  return await inngest.send({
    name: eventName,
    data,
  });
};
