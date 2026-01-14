import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";

export const send24HourReminder = inngest.createFunction(
  {
    id: "send-24h-reminder",
    name: "Send 24 Hour Appointment Reminder",
  },
  { event: "appointment/reminder-24h" },
  async ({ event, step, logger }: EventContext<"appointment/reminder-24h">) => {
    logger.info(
      `Sending 24h reminder for reservation: ${event.data.reservationId}`,
    );

    await step.run("send-whatsapp-reminder", async () => {
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
    };
  },
);

export const send2HourReminder = inngest.createFunction(
  {
    id: "send-2h-reminder",
    name: "Send 2 Hour Appointment Reminder",
  },
  { event: "appointment/reminder-2h" },
  async ({ event, step, logger }: EventContext<"appointment/reminder-2h">) => {
    logger.info(
      `Sending 2h reminder for reservation: ${event.data.reservationId}`,
    );

    await step.run("send-whatsapp-reminder", async () => {
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
    };
  },
);
