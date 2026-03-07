import { createTool } from "@voltagent/core";
import { z } from "zod";
import { ReservationRequestRepository } from "../../../../services/repository/reservation-request";
import { ReservationRepository } from "../../../../services/repository/reservation";
import { ProfileRepository } from "../../../../services/repository/profile";
import { MedicalServiceRepository } from "../../../../services/repository/medical-service";

const reservationRequestRepository = new ReservationRequestRepository();
const reservationRepository = new ReservationRepository();
const profileRepository = new ProfileRepository();
const medicalServiceRepository = new MedicalServiceRepository();

const metadataSchema = z.object({
  symptoms: z
    .array(z.string())
    .optional()
    .describe("Síntomas reportados por el paciente"),
  urgencyLevel: z
    .enum(["low", "normal", "high", "urgent"])
    .optional()
    .describe("Nivel de urgencia de la consulta"),
  isNewPatient: z.boolean().optional().describe("True si es paciente nuevo"),
  insuranceProvider: z
    .string()
    .optional()
    .describe("Aseguradora/seguro médico"),
  notes: z.string().optional().describe("Notas adicionales"),
});

const CreateReservationInput = z.object({
  profileId: z.string().describe("ID del perfil/doctor"),
  serviceId: z.string().describe("ID del servicio médico"),
  preferredDate: z.string().describe("Fecha preferida en formato YYYY-MM-DD"),
  preferredTime: z
    .string()
    .describe("Hora preferida en formato HH:MM (24 horas)"),
  timezone: z
    .string()
    .describe("Zona horaria IANA del paciente (ej: America/Lima)"),
  patientName: z.string().describe("Nombre completo del paciente"),
  patientPhone: z.string().describe("Número de teléfono del paciente"),
  patientEmail: z.string().optional().describe("Email del paciente (opcional)"),
  chiefComplaint: z
    .string()
    .optional()
    .describe("Motivo principal de la consulta"),
  metadata: metadataSchema
    .optional()
    .describe("Información adicional del paciente"),
});

const CheckAvailabilityInput = z.object({
  profileId: z.string().describe("ID del perfil/doctor"),
  serviceId: z.string().describe("ID del servicio médico"),
  date: z.string().describe("Fecha a consultar en formato YYYY-MM-DD"),
  timezone: z
    .string()
    .optional()
    .describe("Zona horaria IANA (ej: America/Lima). Por defecto America/Lima"),
});

/**
 * Generate time slots based on profile work hours and existing reservations
 */
async function generateAvailableSlots(
  profileId: string,
  serviceId: string,
  date: string,
  timezone: string,
): Promise<
  Array<{
    id: string;
    startTime: string;
    endTime: string;
    available: boolean;
  }>
> {
  // Get profile with work schedule
  const profile = await profileRepository.findById(profileId);
  if (!profile) {
    throw new Error("Perfil no encontrado");
  }

  // Check if profile is accepting appointments
  if (!profile.isAcceptingAppointments) {
    return [];
  }

  // Get service duration
  const service = await medicalServiceRepository.findById(serviceId);
  if (!service) {
    throw new Error("Servicio no encontrado");
  }

  const serviceDuration = service.duration || 30;
  const appointmentDuration =
    profile.appointmentDuration || serviceDuration || 30;

  // Parse work hours
  const workStartTime = profile.workStartTime || "09:00";
  const workEndTime = profile.workEndTime || "18:00";
  const workDays = profile.workDays || [1, 2, 3, 4, 5]; // Mon-Fri default

  // Parse the requested date
  const [year, month, day] = date.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day);
  const dayOfWeek = checkDate.getDay() || 7; // Convert Sunday (0) to 7

  // Check if it's a work day
  if (!workDays.includes(dayOfWeek)) {
    return [];
  }

  // Get existing reservations for this date
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  const existingReservations = await reservationRepository.findByProfileId(
    profileId,
  );

  // Filter reservations for this specific date
  const reservationsForDate = existingReservations.filter((res) => {
    const resDate = new Date(res.scheduledAtUtc);
    return (
      res.status === "confirmed" &&
      resDate >= startOfDay &&
      resDate <= endOfDay
    );
  });

  // Generate all possible slots
  const slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    available: boolean;
  }> = [];

  const [startHour, startMinute] = workStartTime.split(":").map(Number);
  const [endHour, endMinute] = workEndTime.split(":").map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const slotStart = new Date(year, month - 1, day, currentHour, currentMinute);
    const slotEnd = new Date(
      year,
      month - 1,
      day,
      currentHour,
      currentMinute + appointmentDuration,
    );

    // Check if slot overlaps with any existing reservation
    const isAvailable = !reservationsForDate.some((res) => {
      const resStart = new Date(res.scheduledAtUtc);
      const resEnd = new Date(
        resStart.getTime() + appointmentDuration * 60 * 1000,
      );
      return slotStart < resEnd && slotEnd > resStart;
    });

    // Check if slot doesn't exceed work end time
    const slotEndHour = slotEnd.getHours();
    const slotEndMinute = slotEnd.getMinutes();
    const withinWorkHours =
      slotEndHour < endHour ||
      (slotEndHour === endHour && slotEndMinute <= endMinute);

    if (withinWorkHours) {
      const timeString = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      slots.push({
        id: `slot-${date}-${timeString}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: isAvailable,
      });
    }

    // Move to next slot
    currentMinute += appointmentDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}

export const checkAvailabilityTool = createTool({
  name: "check_availability",
  description:
    "Verificar disponibilidad de horarios para un servicio médico en una fecha específica. Usa esto ANTES de crear una reserva para mostrar los horarios disponibles al paciente.",
  parameters: CheckAvailabilityInput,
  execute: async (data) => {
    try {
      const slots = await generateAvailableSlots(
        data.profileId,
        data.serviceId,
        data.date,
        data.timezone || "America/Lima",
      );

      const availableSlots = slots.filter((s) => s.available);

      if (availableSlots.length === 0) {
        return {
          success: true,
          date: data.date,
          available: false,
          message:
            "No hay horarios disponibles para esta fecha. Por favor, solicita otra fecha.",
          slots: [],
        };
      }

      return {
        success: true,
        date: data.date,
        available: true,
        message: `Hay ${availableSlots.length} horarios disponibles para el ${data.date}`,
        slots: availableSlots.map((slot) => ({
          id: slot.id,
          time: new Date(slot.startTime).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      };
    } catch (error) {
      return {
        error: true,
        message: `Error verificando disponibilidad: ${error instanceof Error ? error.message : "Error desconocido"}`,
      };
    }
  },
});

export const createReservationTool = createTool({
  name: "create_reservation",
  description:
    "Crear una nueva solicitud de cita médica. Usa esto cuando un paciente confirma que quiere agendar una cita. La solicitud quedará pendiente de aprobación. El paciente será notificado por WhatsApp.",
  parameters: CreateReservationInput,
  execute: async (data) => {
    try {
      const reservation = await reservationRequestRepository.create({
        profileId: data.profileId,
        serviceId: data.serviceId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail || null,
        chiefComplaint: data.chiefComplaint || null,
        status: "pending",
        urgencyLevel: data.metadata?.urgencyLevel || "normal",
        preferredContactMethod: "whatsapp",
        preferredAtUtc: new Date(), // Will be converted by the service
        requestedTimezone: data.timezone,
        metadata: data.metadata || {},
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      return {
        success: true,
        reservation: {
          id: reservation.id,
          status: reservation.status,
          preferredAtUtc: reservation.preferredAtUtc.toISOString(),
          requestedTimezone: reservation.requestedTimezone,
          expiresAt: reservation.expiresAt.toISOString(),
          message:
            "Tu solicitud de cita ha sido enviada. El médico la revisará y confirmará pronto. Te notificaremos por WhatsApp cuando sea aprobada.",
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error creando solicitud: ${error instanceof Error ? error.message : "Error desconocido"}`,
      };
    }
  },
});
