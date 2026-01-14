import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";

export const handleReservationApproved = inngest.createFunction(
  {
    id: "handle-reservation-approved",
    name: "Handle Reservation Approved",
  },
  { event: "reservation/approved" },
  async ({ event, step, logger }: EventContext<"reservation/approved">) => {
    logger.info(
      `Handling approved reservation ${event.data.reservationId} for profile ${event.data.profileId}`,
    );

    await step.run("schedule-reminders", async () => {
      const scheduledReminders: Array<{
        id: string;
        type: string;
        scheduledFor: string;
        status: string;
      }> = [];
      return { scheduledReminders };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
    };
  },
);

export const handleReservationCancelled = inngest.createFunction(
  {
    id: "handle-reservation-cancelled",
    name: "Handle Reservation Cancelled",
  },
  { event: "reservation/cancelled" },
  async ({ event, step, logger }: EventContext<"reservation/cancelled">) => {
    logger.info(
      `Handling cancelled reservation ${event.data.reservationId} by ${event.data.cancelledBy}`,
    );

    await step.run("cancel-reminders", async () => {
      return { cancelled: true };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
    };
  },
);
