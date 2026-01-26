import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { timeSlot } from "../../../../db/schema/time-slot";
import { reservationRequest } from "../../../../db/schema/reservation-request";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * Input schema for checking availability
 */
const CheckAvailabilityInput = z.object({
  profileId: z.string().describe("The profile/doctor ID"),
  serviceId: z.string().describe("The service ID to check availability for"),
  date: z.string().describe("Date in YYYY-MM-DD format to check availability"),
});

/**
 * Input schema for creating a reservation request
 */
const CreateReservationInput = z.object({
  profileId: z.string().describe("The profile/doctor ID"),
  slotId: z.string().describe("The time slot ID"),
  serviceId: z.string().describe("The service ID"),
  patientName: z.string().describe("Patient full name"),
  patientPhone: z.string().describe("Patient phone number"),
  patientEmail: z.string().optional().describe("Patient email (optional)"),
  chiefComplaint: z.string().optional().describe("Main complaint or reason for visit"),
});

/**
 * Tool to check available time slots for a service on a specific date
 */
export const checkAvailabilityTool = createTool({
  name: "check_availability",
  description:
    "Check available time slots for a service on a specific date. Use this when a patient wants to schedule an appointment. Returns available slots with start times. Only shows slots that are currently available (not booked).",
  parameters: CheckAvailabilityInput,
  execute: async ({ profileId, serviceId, date }) => {
    try {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const slots = await db
        .select({
          id: timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          maxReservations: timeSlot.maxReservations,
          currentReservations: timeSlot.currentReservations,
        })
        .from(timeSlot)
        .where(
          and(
            eq(timeSlot.profileId, profileId),
            eq(timeSlot.serviceId, serviceId),
            eq(timeSlot.status, "available"),
            gte(timeSlot.startTime, startOfDay)
          )
        )
        .orderBy(timeSlot.startTime);

      const availableSlots = slots
        .filter((slot) => slot.currentReservations < slot.maxReservations)
        .map((slot) => ({
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          available: slot.maxReservations - slot.currentReservations,
        }));

      return {
        success: true,
        date,
        availableSlots,
        totalAvailable: availableSlots.length,
      };
    } catch (error) {
      return {
        error: true,
        message: `Error checking availability: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Tool to create a reservation request (pending approval)
 */
export const createReservationTool = createTool({
  name: "create_reservation",
  description:
    "Create a new reservation request. Use this when a patient confirms they want to book an appointment. The request will be pending approval and the patient will be notified. Returns the reservation ID for tracking.",
  parameters: CreateReservationInput,
  execute: async (data) => {
    try {
      const requestedTime = new Date();

      const [reservation] = await db
        .insert(reservationRequest)
        .values({
          ...data,
          requestedTime,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "pending",
          urgencyLevel: "normal",
          preferredContactMethod: "whatsapp",
        })
        .returning();

      return {
        success: true,
        reservation: {
          id: reservation.id,
          status: reservation.status,
          requestedTime: reservation.requestedTime.toISOString(),
          expiresAt: reservation.expiresAt.toISOString(),
          message:
            "Tu solicitud de cita ha sido enviada. El médico la revisará y confirmará pronto. Te notificaremos por WhatsApp cuando sea aprobada.",
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error creating reservation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
