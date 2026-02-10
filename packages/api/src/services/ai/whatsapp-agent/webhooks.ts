import { Elysia, t } from "elysia";
import { env } from "../../../config/env";
import { EvolutionService } from "../../../services/business/evolution-api";
import { db } from "../../../db";
import { profile, whatsappConfig } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { WhatsAppContextRepository } from "../../../services/repository/whatsapp-context";
import { getMedicalChatAgent } from "../chat/agent";
import { getMessageStrategy } from "../messaging";

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

/**
 * Mensajes de fallback en caso de error del agente IA
 */
const FALLBACK_MESSAGES = {
  error:
    "Lo siento, estoy teniendo dificultades técnicas. Por favor intenta de nuevo más tarde o contacta directamente.",
  welcome:
    "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte? Puedo responder preguntas sobre servicios, horarios o ayudarte a agendar una cita.",
};

/**
 * Keywords que indican que se necesita transferencia al web chat
 * porque requiere componentes interactivos
 */
const TRANSFER_KEYWORDS = [
  "agendar",
  "reservar",
  "cita",
  "horario",
  "disponible",
  "calendario",
];

async function getProfileByInstanceName(instanceName: string) {
  const config = await db.query.whatsappConfig.findFirst({
    where: eq(whatsappConfig.instanceName, instanceName),
  });

  if (!config) return null;

  const profileData = await db.query.profile.findFirst({
    where: eq(profile.id, config.profileId),
  });

  return profileData;
}

/**
 * Determina si una conversación debe transferirse al web chat
 * basado en keywords o decisión del agente
 */
function shouldTransferToWebChat(userMessage: string): boolean {
  const lowerText = userMessage.toLowerCase();
  return TRANSFER_KEYWORDS.some((keyword) => lowerText.includes(keyword));
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
        await contextRepository.create({
          phone,
          profileId: profileData.id,
          initialMessage: text,
        });
      }

      // Check if should transfer based on keywords
      if (shouldTransferToWebChat(text)) {
        const transferMessage =
          "Para ayudarte con esto, te invito a continuar en nuestro chat web donde podré mostrarte opciones interactivas y agendar tu cita fácilmente.";

        await contextRepository.addMessage(phone, "assistant", transferMessage);
        await contextRepository.markTransferredToWidget(phone);

        const webUrl = env.WEB_URL;
        const transferUrl = `${webUrl}/${profileData.username}/chat?from=whatsapp&phone=${encodeURIComponent(phone)}`;

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

      // Use AI Agent for response
      try {
        const agent = getMedicalChatAgent();
        const strategy = getMessageStrategy("whatsapp");

        // Build conversation ID based on phone
        const conversationId = `whatsapp:${profileData.id}:${phone}`;

        // Get profile info for context
        const profileInfo = {
          displayName: profileData.displayName || profileData.username,
          title: profileData.title || "",
          bio: profileData.bio || "",
        };

        // Build profile context
        const profileContext = `Información del profesional:
Nombre: ${profileInfo.displayName}
Título: ${profileInfo.title || "No especificado"}
Biografía: ${profileInfo.bio || "No especificada"}
---
`;

        const fullMessage = `${profileContext}${text}`;

        // Generate AI response
        const result = await agent.generateText(fullMessage, {
          conversationId,
          context: new Map([
            ["userPhone", phone],
            ["channel", "whatsapp"],
            ["profileId", profileData.id],
            ["profileDisplayName", profileInfo.displayName],
            ["profileTitle", profileInfo.title],
            ["supportsRichComponents", "false"],
          ]),
        });

        // Format response for WhatsApp (convert to plain text)
        const formatted = strategy.formatResponse(result.text);

        // Save to context
        await contextRepository.addMessage(
          phone,
          "assistant",
          formatted.text,
        );

        // Send response
        await evolutionService.sendText(instance, {
          number: phone,
          text: formatted.text,
        });

        return {
          success: true,
          answered: true,
          messageId: data.key.id,
          aiGenerated: true,
        };
      } catch (aiError) {
        console.error("AI Agent error:", aiError);

        // Fallback to default message on AI error
        const fallbackMessage = FALLBACK_MESSAGES.error;
        await contextRepository.addMessage(phone, "assistant", fallbackMessage);

        await evolutionService.sendText(instance, {
          number: phone,
          text: fallbackMessage,
        });

        return {
          success: true,
          answered: true,
          fallback: true,
          messageId: data.key.id,
        };
      }
    } catch (err) {
      console.error("WhatsApp agent webhook error:", err);
      return { success: false, error: "Internal processing error" };
    }
  },
  {
    body: t.Any(),
  },
);
