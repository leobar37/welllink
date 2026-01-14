import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";

export const sendFollowUpMessage = inngest.createFunction(
  {
    id: "send-follow-up-message",
    name: "Send Post-Appointment Follow-Up",
  },
  { event: "appointment/follow-up" },
  async ({ event, step, logger }: EventContext<"appointment/follow-up">) => {
    logger.info(
      `Sending ${event.data.followUpType} follow-up for reservation ${event.data.reservationId}`,
    );

    await step.run("send-follow-up", async () => {
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
    };
  },
);
