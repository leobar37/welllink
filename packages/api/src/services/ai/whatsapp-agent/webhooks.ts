import { Elysia, t } from "elysia";
import { env } from "../../../config/env";
import { EvolutionService } from "../../../services/business/evolution-api";
import { db } from "../../../db";
import { profile, whatsappConfig } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { WhatsAppContextRepository } from "../../../services/repository/whatsapp-context";

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType?: string;
    pushName?: string;
  };
}

const quickFAQResponses: Record<string, string> = {
  horarios:
    "Nuestros horarios son Lunes a Viernes 9:00-18:00 y Sábados 9:00-13:00. ¿Te gustaría agendar una cita?",
  precios:
    "Los precios varían según el servicio. Puedo mostrarte nuestra lista de servicios con precios. ¿Te gustaría verla?",
  ubicacion:
    "Nuestra dirección y enlace a Google Maps están en nuestro perfil público. ¿Te los envío?",
  servicios:
    "Ofrecemos consultas generales, especialidades y más. ¿Te gustaría ver nuestra lista completa de servicios?",
  contacto:
    "Puedes contactarnos aquí mismo por WhatsApp. ¿En qué puedo ayudarte hoy?",
  general:
    "¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre horarios, precios, ubicación o agendar una cita.",
};

async function getProfileByInstanceName(instanceName: string) {
  // Find profile by looking up the WhatsApp config with this instance
  const config = await db.query.whatsappConfig.findFirst({
    where: eq(whatsappConfig.instanceName, instanceName),
  });

  if (!config) return null;

  const profileData = await db.query.profile.findFirst({
    where: eq(profile.id, config.profileId),
  });

  return profileData;
}

export const whatsappAgentWebhook = new Elysia({
  prefix: "/whatsapp/agent",
}).post(
  "/webhook",
  async ({ request }) => {
    try {
      const body = (await request.json()) as EvolutionWebhookPayload;
      const { event, instance, data } = body;

      if (event !== "MESSAGES_UPSERT") {
        return { success: true, skipped: event };
      }

      if (!data.key) {
        return { success: true, skipped: "no-key" };
      }

      // Filter out messages from the bot itself
      if (data.key.fromMe) {
        return { success: true, skipped: "self-message" };
      }

      // Filter out group messages
      if (data.key.remoteJid?.includes("@g.us")) {
        return { success: true, skipped: "group-message" };
      }

      // Extract message content
      const text =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        "";

      if (!text) {
        return { success: true, skipped: "no-text" };
      }

      const phone = data.key.remoteJid?.replace("@s.whatsapp.net", "") || "";

      if (!phone) {
        return { success: true, skipped: "no-phone" };
      }

      // Initialize services
      const contextRepository = new WhatsAppContextRepository();
      const evolutionService = new EvolutionService({
        baseUrl: env.EVOLUTION_API_URL,
        apiKey: env.EVOLUTION_API_KEY,
      });

      // Get profile by instance name
      const profileData = await getProfileByInstanceName(instance);

      if (!profileData) {
        return { success: true, skipped: "no-profile" };
      }

      // Check if context exists and its status
      const context = await contextRepository.findByPhone(phone);

      if (context) {
        // Check if paused for human - do not respond automatically
        if (context.status === "PAUSED_FOR_HUMAN") {
          return {
            success: true,
            skipped: "paused-for-human",
          };
        }

        // Check if already transferred to widget
        if (context.status === "TRANSFERRED_TO_WIDGET") {
          return {
            success: true,
            skipped: "already-transferred",
          };
        }
      }

      // Add user message to context
      if (context) {
        await contextRepository.addMessage(phone, "user", text);
      } else {
        // Create new context
        await contextRepository.create({
          phone,
          profileId: profileData.id,
          initialMessage: text,
        });
      }

      // Analyze message and determine response
      const lowerText = text.toLowerCase();

      // Keywords that indicate need for transfer
      const transferKeywords = [
        "cita",
        "agendar",
        "reservar",
        "horario",
        "disponible",
        "precio",
        "consulta",
        "atención",
      ];
      const shouldTransfer = transferKeywords.some((kw) =>
        lowerText.includes(kw),
      );

      if (shouldTransfer) {
        // Save assistant message suggesting transfer
        const transferMessage =
          "Para esto es mejor que conversemos directamente. Te paso a nuestro chat donde podrás agendar tu cita con calma.";
        await contextRepository.addMessage(phone, "assistant", transferMessage);

        // Mark as transferred
        await contextRepository.markTransferredToWidget(phone);

        // Generate transfer URL
        const webUrl = env.WEB_URL;
        const transferUrl = `${webUrl}/${profileData.username}/chat?from=whatsapp&phone=${encodeURIComponent(phone)}`;

        // Send transfer message with link
        await evolutionService.sendText(instance, {
          number: phone,
          text: `${transferMessage}\n\n${transferUrl}`,
        });

        return {
          success: true,
          transferred: true,
          messageId: data.key.id,
        };
      }

      // Try quick FAQ matching
      let faqAnswer: string | null = null;

      if (
        lowerText.includes("horario") ||
        lowerText.includes("horarios") ||
        lowerText.includes("disponible")
      ) {
        faqAnswer = quickFAQResponses.horarios;
      } else if (
        lowerText.includes("precio") ||
        lowerText.includes("costo") ||
        lowerText.includes("cuánto")
      ) {
        faqAnswer = quickFAQResponses.precios;
      } else if (
        lowerText.includes("ubicación") ||
        lowerText.includes("dirección") ||
        lowerText.includes("donde")
      ) {
        faqAnswer = quickFAQResponses.ubicacion;
      } else if (
        lowerText.includes("servicio") ||
        lowerText.includes("ofrecen")
      ) {
        faqAnswer = quickFAQResponses.servicios;
      } else if (
        lowerText.includes("hola") ||
        lowerText.includes("buenos") ||
        lowerText.includes("saludos")
      ) {
        faqAnswer = quickFAQResponses.general;
      }

      if (faqAnswer) {
        await contextRepository.addMessage(phone, "assistant", faqAnswer);

        await evolutionService.sendText(instance, {
          number: phone,
          text: faqAnswer,
        });

        return {
          success: true,
          answered: true,
          messageId: data.key.id,
        };
      }

      // Default response - suggest transfer for complex queries
      const defaultMessage =
        "Para atenderte mejor, te recomiendo continuar en nuestro chat interactivo donde podrás agendar tu cita. ¿Te paso el enlace?";
      await contextRepository.addMessage(phone, "assistant", defaultMessage);
      await contextRepository.markTransferredToWidget(phone);

      const webUrl = env.WEB_URL;
      const transferUrl = `${webUrl}/${profileData.username}/chat?from=whatsapp&phone=${encodeURIComponent(phone)}`;

      await evolutionService.sendText(instance, {
        number: phone,
        text: `${defaultMessage}\n\n${transferUrl}`,
      });

      return {
        success: true,
        transferred: true,
        messageId: data.key.id,
      };
    } catch (err) {
      console.error("WhatsApp agent webhook error:", err);
      // Always return 200 to prevent webhook retries
      return { success: false, error: "Internal processing error" };
    }
  },
  {
    body: t.Any(),
  },
);
