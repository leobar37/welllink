import { addDays } from "date-fns";
import { inngest } from "../../lib/inngest-client";
import { evolutionService, type EventContext } from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { db } from "../../db";
import { whatsappConfig } from "../../db/schema";
import { eq, and } from "drizzle-orm";

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

    const result = await step.run("send-follow-up-message", async () => {
      const eventData = event.data;

      const followUpDate = new Date(eventData.appointmentDate);
      const formattedDate = followUpDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const questionsText = eventData.followUpQuestions
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n");

      const message = `🏥 *SEGUIMIENTO POST-CONSULTA*

Hola ${eventData.patientName},

Espero que te estés sientiendo bien después de tu consulta del ${formattedDate}.

${questionsText ? `\n📋 *Preguntas para ti:*\n${questionsText}\n` : ""}

Si tienes alguna pregunta o preocupación, no dudes en contactarnos.

¡Tu salud es nuestra prioridad!

---
*Wellness Link*`;

      const formattedPhone = evolutionService.formatPhoneNumber(
        eventData.patientPhone,
      );

      try {
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
          await evolutionService.sendText(configs[0].instanceName, {
            number: formattedPhone,
            text: message,
          });
        }

        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        logger.error("Error sending follow-up message:", error);
        return { success: false, error };
      }
    });

    return {
      success: result.success,
      reservationId: event.data.reservationId,
      sentAt: result.sentAt,
    };
  },
);
