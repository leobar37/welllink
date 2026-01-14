import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";

export const notifyDoctorNewRequest = inngest.createFunction(
  {
    id: "notify-doctor-new-request",
    name: "Notify Doctor of New Reservation Request",
  },
  { event: "doctor/new-request" },
  async ({ event, step, logger }: EventContext<"doctor/new-request">) => {
    logger.info(
      `Notifying doctor ${event.data.profileId} of new request from ${event.data.patientName}`,
    );

    await step.run("send-doctor-notification", async () => {
      return { notified: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      requestId: event.data.requestId,
    };
  },
);

export const notifyDoctorRequestExpired = inngest.createFunction(
  {
    id: "notify-doctor-request-expired",
    name: "Notify Doctor of Expired Request",
  },
  { event: "doctor/request-expired" },
  async ({ event, step, logger }: EventContext<"doctor/request-expired">) => {
    logger.info(
      `Notifying doctor ${event.data.profileId} of expired request ${event.data.requestId}`,
    );

    await step.run("send-expiration-notification", async () => {
      return { notified: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      requestId: event.data.requestId,
    };
  },
);
