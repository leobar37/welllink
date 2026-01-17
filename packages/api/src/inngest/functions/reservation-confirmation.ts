import { subHours, isBefore, addDays } from "date-fns";
import { inngest } from "../../lib/inngest-client";
import {
  evolutionService,
  type EventContext,
  type InngestFunctionContext,
} from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { ProfileRepository } from "../../services/repository/profile";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { ReservationRepository } from "../../services/repository/reservation";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { db } from "../../db";
import { profile } from "../../db/schema";
import { eq, and } from "drizzle-orm";

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

    const appointmentTime = new Date(event.data.appointmentTime || new Date());
    const now = new Date();

    const scheduledReminders: Array<{
      id: string;
      type: string;
      scheduledFor: string;
      status: string;
    }> = [];

    await step.run("fetch-reservation-details", async () => {
      const reservationRepository = new ReservationRepository();
      const timeSlotRepository = new TimeSlotRepository();
      const medicalServiceRepository = new MedicalServiceRepository();
      const profileRepository = new ProfileRepository();

      const reservation = await reservationRepository.findById(
        event.data.reservationId,
      );
      if (!reservation) {
        logger.warn(`Reservation ${event.data.reservationId} not found`);
        return null;
      }

      const slot = await timeSlotRepository.findById(reservation.slotId);
      const service = await medicalServiceRepository.findById(
        reservation.serviceId,
      );
      const profileData = await profileRepository.findById(
        event.data.profileId,
      );

      return { reservation, slot, service, profile: profileData };
    });

    await step.run("schedule-reminders", async () => {
      const reminder24h = subHours(appointmentTime, 24);
      const reminder2h = subHours(appointmentTime, 2);

      if (!isBefore(reminder24h, now)) {
        await inngest.send({
          name: "appointment/reminder-24h",
          data: {
            reservationId: event.data.reservationId,
            profileId: event.data.profileId,
            patientName: event.data.patientName || "",
            patientPhone: event.data.patientPhone || "",
            appointmentTime: appointmentTime.toISOString(),
            serviceName: event.data.serviceName || "",
            doctorName: event.data.doctorName || "",
            clinicName: event.data.clinicName || "",
            clinicAddress: event.data.clinicAddress || "",
          },
          scheduledFor: reminder24h.toISOString(),
        });

        scheduledReminders.push({
          id: `reminder-24h-${event.data.reservationId}`,
          type: "24h",
          scheduledFor: reminder24h.toISOString(),
          status: "scheduled",
        });
      }

      if (!isBefore(reminder2h, now)) {
        await inngest.send({
          name: "appointment/reminder-2h",
          data: {
            reservationId: event.data.reservationId,
            profileId: event.data.profileId,
            patientName: event.data.patientName || "",
            patientPhone: event.data.patientPhone || "",
            appointmentTime: appointmentTime.toISOString(),
            serviceName: event.data.serviceName || "",
            clinicName: event.data.clinicName || "",
            clinicAddress: event.data.clinicAddress || "",
          },
          scheduledFor: reminder2h.toISOString(),
        });

        scheduledReminders.push({
          id: `reminder-2h-${event.data.reservationId}`,
          type: "2h",
          scheduledFor: reminder2h.toISOString(),
          status: "scheduled",
        });
      }

      logger.info(
        `Scheduled ${scheduledReminders.length} reminders for reservation ${event.data.reservationId}`,
      );
    });

    await step.run("schedule-follow-up", async () => {
      const followUpTime = addDays(appointmentTime, 1);

      if (!isBefore(followUpTime, now)) {
        await inngest.send({
          name: "appointment/follow-up",
          data: {
            reservationId: event.data.reservationId,
            profileId: event.data.profileId,
            patientName: event.data.patientName || "",
            patientPhone: event.data.patientPhone || "",
            appointmentDate: appointmentTime.toISOString(),
            followUpType: "24h",
            followUpQuestions: [
              "¿Cómo se sintió después de la consulta?",
              "¿Tiene alguna pregunta sobre su tratamiento?",
              "¿Necesita agendar una cita de seguimiento?",
            ],
          },
          scheduledFor: followUpTime.toISOString(),
        });

        scheduledReminders.push({
          id: `follow-up-${event.data.reservationId}`,
          type: "follow-up",
          scheduledFor: followUpTime.toISOString(),
          status: "scheduled",
        });
      }
    });

    await step.run("mark-reminders-scheduled", async () => {
      const reservationRepository = new ReservationRepository();
      await reservationRepository.updateReminderFlags(
        event.data.reservationId,
        {
          reminder24hScheduled: true,
          reminder2hScheduled: true,
        },
      );
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
      scheduledReminders,
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

    const result = await step.run("cancel-reminders-and-update", async () => {
      const reservationRepository = new ReservationRepository();

      await reservationRepository.updateStatus(
        event.data.reservationId,
        "cancelled",
      );

      const slotRepository = new TimeSlotRepository();
      const reservation = await reservationRepository.findById(
        event.data.reservationId,
      );

      if (reservation) {
        await slotRepository.updateStatus(reservation.slotId, "available");
        await slotRepository.decrementReservations(reservation.slotId);
      }

      return { cancelled: true, slotUpdated: !!reservation };
    });

    return {
      success: true,
      reservationId: event.data.reservationId,
      ...result,
    };
  },
);
