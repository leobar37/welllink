import { createTool } from "@voltagent/core";
import { z } from "zod";
import { ReservationRequestRepository } from "../../../../services/repository/reservation-request";

const reservationRequestRepository = new ReservationRequestRepository();

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
