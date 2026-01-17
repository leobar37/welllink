import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { db } from "../../db";
import { whatsappConfig, profile } from "../../db/schema";
import { eq, and } from "drizzle-orm";

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

    const result = await step.run("send-doctor-notification", async () => {
      const eventData = event.data;

      const formattedDate = new Date(
        eventData.appointmentTime,
      ).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const formattedTime = new Date(
        eventData.appointmentTime,
      ).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `🩺 *NUEVA SOLICITUD DE CITA*

👤 *Paciente:* ${eventData.patientName}
📞 *Teléfono:* ${eventData.patientPhone}
🏥 *Servicio:* ${eventData.serviceName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${formattedTime}
⚡ *Urgencia:* ${eventData.urgencyLevel}

${eventData.chiefComplaint ? `📝 *Motivo:*\n${eventData.chiefComplaint}` : ""}

---
Responde en el dashboard para aprobar o rechazar.`;

      try {
        const profileData = await db
          .select()
          .from(profile)
          .where(eq(profile.id, eventData.profileId))
          .limit(1);

        if (!profileData[0]?.whatsappNumber) {
          return {
            notified: false,
            error: "Doctor has no WhatsApp number configured",
          };
        }

        const configs = await db
          .select()
          .from(whatsappConfig)
          .where(
            and(
              eq(whatsappConfig.profileId, eventData.profileId),
              eq(whatsappConfig.isEnabled, true),
              eq(whatsappConfig.isConnected, true),
            ),
          )
          .limit(1);

        if (configs.length > 0) {
          const formattedPhone = evolutionService.formatPhoneNumber(
            profileData[0].whatsappNumber,
          );
          await evolutionService.sendText(configs[0].instanceName, {
            number: formattedPhone,
            text: message,
          });
        }

        return { notified: true, timestamp: new Date().toISOString() };
      } catch (error) {
        logger.error("Error sending doctor notification:", error);
        return { notified: false, error };
      }
    });

    return {
      notified: result.notified,
      requestId: event.data.requestId,
      timestamp: result.timestamp,
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

    const result = await step.run("send-expiration-notification", async () => {
      const eventData = event.data;

      const formattedDate = new Date(eventData.expiredAt).toLocaleDateString(
        "es-ES",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      const message = `⏰ *SOLICITUD EXPIRADA*

La solicitud del paciente *${eventData.patientName}* ha expirado sin respuesta.

📅 *Fecha de solicitud:* ${formattedDate}

El horario ha sido liberado y está disponible para otros pacientes.`;

      try {
        const profileData = await db
          .select()
          .from(profile)
          .where(eq(profile.id, eventData.profileId))
          .limit(1);

        if (!profileData[0]?.whatsappNumber) {
          return {
            notified: false,
            error: "Doctor has no WhatsApp number configured",
          };
        }

        const configs = await db
          .select()
          .from(whatsappConfig)
          .where(
            and(
              eq(whatsappConfig.profileId, eventData.profileId),
              eq(whatsappConfig.isEnabled, true),
              eq(whatsappConfig.isConnected, true),
            ),
          )
          .limit(1);

        if (configs.length > 0) {
          const formattedPhone = evolutionService.formatPhoneNumber(
            profileData[0].whatsappNumber,
          );
          await evolutionService.sendText(configs[0].instanceName, {
            number: formattedPhone,
            text: message,
          });
        }

        return { notified: true, timestamp: new Date().toISOString() };
      } catch (error) {
        logger.error("Error sending expiration notification:", error);
        return { notified: false, error };
      }
    });

    return {
      notified: result.notified,
      requestId: event.data.requestId,
      timestamp: result.timestamp,
    };
  },
);
