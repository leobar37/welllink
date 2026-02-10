import { subHours } from "date-fns";
import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { NotificationService } from "../../services/business/notification";
import { WhatsAppConfigRepository } from "../../services/repository/whatsapp-config";
import { ProfileRepository } from "../../services/repository/profile";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { ReservationRepository } from "../../services/repository/reservation";

function createNotificationService() {
  return new NotificationService(
    new WhatsAppConfigRepository(),
    new ProfileRepository(),
    new MedicalServiceRepository(),
    evolutionService,
  );
}

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

    const result = await step.run("send-whatsapp-reminder-24h", async () => {
      const notificationService = createNotificationService();
      const reservationRepository = new ReservationRepository();

      const reservation = await reservationRepository.findById(
        event.data.reservationId,
      );
      if (!reservation) {
        return { success: false, error: "Reservation not found" };
      }

      const service = await new MedicalServiceRepository().findById(
        reservation.serviceId,
      );

      if (!service) {
        return { success: false, error: "Service not found" };
      }

      const sent = await notificationService.sendAppointmentReminder(
        event.data.profileId,
        event.data.patientPhone,
        event.data.patientName,
        service.name,
        new Date(event.data.appointmentTime),
        event.data.requestedTimezone || "America/Lima",
        24,
      );

      if (sent.success) {
        await reservationRepository.updateReminderFlags(
          event.data.reservationId,
          { reminder24hSent: true },
        );
      }

      return sent;
    });

    return {
      success: result.success,
      reservationId: event.data.reservationId,
      timestamp: new Date().toISOString(),
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

    const result = await step.run("send-whatsapp-reminder-2h", async () => {
      const notificationService = createNotificationService();
      const reservationRepository = new ReservationRepository();

      const reservation = await reservationRepository.findById(
        event.data.reservationId,
      );
      if (!reservation) {
        return { success: false, error: "Reservation not found" };
      }

      const service = await new MedicalServiceRepository().findById(
        reservation.serviceId,
      );

      if (!service) {
        return { success: false, error: "Service not found" };
      }

      const sent = await notificationService.sendAppointmentReminder(
        event.data.profileId,
        event.data.patientPhone,
        event.data.patientName,
        service.name,
        new Date(event.data.appointmentTime),
        event.data.requestedTimezone || "America/Lima",
        2,
      );

      if (sent.success) {
        await reservationRepository.updateReminderFlags(
          event.data.reservationId,
          { reminder2hSent: true },
        );
      }

      return sent;
    });

    return {
      success: result.success,
      reservationId: event.data.reservationId,
      timestamp: new Date().toISOString(),
    };
  },
);

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
