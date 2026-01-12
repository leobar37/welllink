import { inngest } from "../lib/inngest-client";
import type { MedicalReservationEvents } from "../types/inngest-events";
import { ReservationRequestRepository } from "../services/repository/reservation-request";
import { TimeSlotRepository } from "../services/repository/time-slot";
import { ReservationRepository } from "../services/repository/reservation";
import { ApprovalService } from "../services/business/approval";
import { NotificationService } from "../services/business/notification";
import { MedicalServiceRepository } from "../services/repository/medical-service";
import { WhatsAppConfigRepository } from "../services/repository/whatsapp-config";
import { ProfileRepository } from "../services/repository/profile";
import { EvolutionService } from "../services/business/evolution-api";

const evolutionService = new EvolutionService({
  baseUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  apiKey: process.env.EVOLUTION_API_KEY || "",
});

/**
 * Inngest Functions for Medical Reservation Workflows
 *
 * This file contains all the Inngest functions that handle:
 * - Request expiration
 * - Appointment reminders (24h, 2h)
 * - Doctor notifications for new requests
 * - Slot generation
 * - Follow-up workflows
 */

// ============================================================================
// REQUEST EXPIRATION WORKFLOW
// ============================================================================

/**
 * Expire pending reservation requests that have passed their expiration time
 * Triggered: Every 5 minutes
 */
export const expirePendingRequests = inngest.createFunction(
  {
    id: "expire-pending-requests",
    name: "Expire Pending Reservation Requests",
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step, logger }: any) => {
    logger.info("Starting expiration check for pending requests");

    const reservationRequestRepository = new ReservationRequestRepository();
    const timeSlotRepository = new TimeSlotRepository();
    const reservationRepository = new ReservationRepository();
    const approvalService = new ApprovalService(
      reservationRequestRepository,
      timeSlotRepository,
      reservationRepository,
    );
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const profileRepository = new ProfileRepository();
    const medicalServiceRepository = new MedicalServiceRepository();
    const notificationService = new NotificationService(
      whatsappConfigRepository,
      profileRepository,
      medicalServiceRepository,
      evolutionService,
    );

    const expiredRequests = await step.run("find-expired-requests", async () => {
      return await reservationRequestRepository.findExpiredRequests();
    });

    const results = await Promise.all(
      expiredRequests.map(async (request) => {
        const result = await approvalService.expireRequest(request.id);

        if (result.success) {
          const slot = await timeSlotRepository.findById(request.slotId);
          const service = await medicalServiceRepository.findById(
            request.serviceId,
          );
          const profile = await profileRepository.findById(request.profileId);

          if (profile && slot && service) {
            await notificationService.notifyPatientExpiration(
              request.profileId,
              request.patientPhone,
              request.patientName,
              service.name,
            );

            if (profile.phone) {
              await notificationService.notifyDoctorExpiration(
                request.profileId,
                profile.phone,
                request.patientName,
                request.requestedTime,
              );
            }
          }

          await inngest.send({
            name: "doctor/request-expired",
            data: {
              profileId: request.profileId,
              requestId: request.id,
              patientName: request.patientName,
              expiredAt: new Date().toISOString(),
            },
          });
        }

        return { requestId: request.id, ...result };
      }),
    );

    return {
      success: true,
      processedCount: results.length,
      results,
    };
  },
);

// ============================================================================
// APPOINTMENT REMINDER WORKFLOWS
// ============================================================================

/**
 * Send 24-hour reminder to patients
 * Triggered: Event "appointment/reminder-24h"
 */
export const send24HourReminder = inngest.createFunction(
  {
    id: "send-24h-reminder",
    name: "Send 24 Hour Appointment Reminder",
  },
  { event: "appointment/reminder-24h" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["appointment/reminder-24h"]["data"];

    logger.info(`Sending 24h reminder for reservation: ${data.reservationId}`);

    await step.run("send-whatsapp-reminder", async () => {
      // The actual WhatsApp sending will be handled by the API
      // This function processes the reminder event
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: data.reservationId,
    };
  },
);

/**
 * Send 2-hour reminder to patients
 * Triggered: Event "appointment/reminder-2h"
 */
export const send2HourReminder = inngest.createFunction(
  {
    id: "send-2h-reminder",
    name: "Send 2 Hour Appointment Reminder",
  },
  { event: "appointment/reminder-2h" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["appointment/reminder-2h"]["data"];

    logger.info(`Sending 2h reminder for reservation: ${data.reservationId}`);

    await step.run("send-whatsapp-reminder", async () => {
      // The actual WhatsApp sending will be handled by the API
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: data.reservationId,
    };
  },
);

// ============================================================================
// DOCTOR NOTIFICATION WORKFLOW
// ============================================================================

/**
 * Notify doctor of new reservation request
 * Triggered: Event "doctor/new-request"
 */
export const notifyDoctorNewRequest = inngest.createFunction(
  {
    id: "notify-doctor-new-request",
    name: "Notify Doctor of New Reservation Request",
  },
  { event: "doctor/new-request" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["doctor/new-request"]["data"];

    logger.info(
      `Notifying doctor ${data.profileId} of new request from ${data.patientName}`,
    );

    await step.run("send-doctor-notification", async () => {
      // The actual WhatsApp sending will be handled by the API
      return { notified: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      requestId: data.requestId,
    };
  },
);

/**
 * Notify doctor when request expires
 * Triggered: Event "doctor/request-expired"
 */
export const notifyDoctorRequestExpired = inngest.createFunction(
  {
    id: "notify-doctor-request-expired",
    name: "Notify Doctor of Expired Request",
  },
  { event: "doctor/request-expired" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["doctor/request-expired"]["data"];

    logger.info(
      `Notifying doctor ${data.profileId} of expired request ${data.requestId}`,
    );

    await step.run("send-expiration-notification", async () => {
      // The actual WhatsApp sending will be handled by the API
      return { notified: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      requestId: data.requestId,
    };
  },
);

// ============================================================================
// SLOT GENERATION WORKFLOW
// ============================================================================

/**
 * Generate daily time slots for a doctor
 * Triggered: Event "slot/generate-daily"
 */
export const generateDailySlots = inngest.createFunction(
  {
    id: "generate-daily-slots",
    name: "Generate Daily Time Slots",
  },
  { event: "slot/generate-daily" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["slot/generate-daily"]["data"];

    logger.info(
      `Generating slots for doctor ${data.profileId} on ${data.targetDate}`,
    );

    const generatedSlots = await step.run("create-slots", async () => {
      // This would trigger the slot generation logic in the API
      return {
        count: 0, // API will determine actual count
        profileId: data.profileId,
        targetDate: data.targetDate,
      };
    });

    return {
      success: true,
      generatedSlots,
    };
  },
);

/**
 * Daily slot generation for all doctors
 * Triggered: Every day at midnight
 */
export const dailySlotGenerationForAll = inngest.createFunction(
  {
    id: "daily-slot-generation-all",
    name: "Daily Slot Generation for All Doctors",
  },
  { cron: "0 0 * * *" }, // Every day at midnight
  async ({ step, logger }: any) => {
    logger.info("Starting daily slot generation for all doctors");

    const result = await step.run("trigger-generation", async () => {
      // This would query all active profiles and trigger generation for each
      return {
        timestamp: new Date().toISOString(),
        status: "triggered",
      };
    });

    return {
      success: true,
      result,
    };
  },
);

// ============================================================================
// FOLLOW-UP WORKFLOW
// ============================================================================

/**
 * Send follow-up message after appointment
 * Triggered: Event "appointment/follow-up"
 */
export const sendFollowUpMessage = inngest.createFunction(
  {
    id: "send-follow-up-message",
    name: "Send Post-Appointment Follow-Up",
  },
  { event: "appointment/follow-up" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["appointment/follow-up"]["data"];

    logger.info(
      `Sending ${data.followUpType} follow-up for reservation ${data.reservationId}`,
    );

    await step.run("send-follow-up", async () => {
      // The actual WhatsApp sending will be handled by the API
      return { sent: true, timestamp: new Date().toISOString() };
    });

    return {
      success: true,
      reservationId: data.reservationId,
    };
  },
);

// ============================================================================
// RESERVATION CONFIRMATION WORKFLOW
// ============================================================================

/**
 * Handle reservation approved event
 * Triggered: Event "reservation/approved"
 */
export const handleReservationApproved = inngest.createFunction(
  {
    id: "handle-reservation-approved",
    name: "Handle Reservation Approved",
  },
  { event: "reservation/approved" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["reservation/approved"]["data"];

    logger.info(
      `Handling approved reservation ${data.reservationId} for profile ${data.profileId}`,
    );

    // Schedule reminders based on appointment time
    await step.run("schedule-reminders", async () => {
      const scheduledReminders = [];
      // Reminders would be scheduled here based on appointment time
      return { scheduledReminders };
    });

    return {
      success: true,
      reservationId: data.reservationId,
    };
  },
);

/**
 * Handle reservation cancelled event
 * Triggered: Event "reservation/cancelled"
 */
export const handleReservationCancelled = inngest.createFunction(
  {
    id: "handle-reservation-cancelled",
    name: "Handle Reservation Cancelled",
  },
  { event: "reservation/cancelled" },
  async ({ event, step, logger }: any) => {
    const data = event.data as MedicalReservationEvents["reservation/cancelled"]["data"];

    logger.info(
      `Handling cancelled reservation ${data.reservationId} by ${data.cancelledBy}`,
    );

    // Cancel scheduled reminders
    await step.run("cancel-reminders", async () => {
      return { cancelled: true };
    });

    return {
      success: true,
      reservationId: data.reservationId,
    };
  },
);

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const functions = [
  expirePendingRequests,
  send24HourReminder,
  send2HourReminder,
  notifyDoctorNewRequest,
  notifyDoctorRequestExpired,
  generateDailySlots,
  dailySlotGenerationForAll,
  sendFollowUpMessage,
  handleReservationApproved,
  handleReservationCancelled,
];
