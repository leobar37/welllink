import { Elysia, t } from "elysia";
import { env } from "../../../config/env";
import { EvolutionService } from "../../business/evolution-api";
import { AgentConfigService } from "../../business/agent-config";
import { AgentConfigRepository } from "../../repository/agent-config";
import { db } from "../../../db";
import { profile, whatsappConfig } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { WhatsAppContextRepository } from "../../repository/whatsapp-context";
import { convertToWhatsAppResponse } from "./response-adapter";
import { getMedicalChatAgent } from "../chat";

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

async function getAgentConfig(profileId: string) {
  const agentConfigRepository = new AgentConfigRepository();
  return agentConfigRepository.findByProfile({ userId: "" } as any, profileId);
}

function generateTransferUrl(profileUsername: string, phone: string) {
  const webUrl = env.WEB_URL || "https://wellness-link.com";
  return `${webUrl}/${profileUsername}/chat?from=whatsapp&phone=${encodeURIComponent(phone)}`;
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

      // Get agent config
      const config = await getAgentConfig(profileData.id);

      // Check if WhatsApp agent is enabled
      if (config && !config.whatsappEnabled) {
        return { success: true, skipped: "whatsapp-disabled" };
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
          // Optionally send a reminder message
          const transferUrl = generateTransferUrl(profileData.username, phone);
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

      // Build message for the agent
      const conversationId = `whatsapp-${phone}-${Date.now()}`;

      // Get agent instructions with custom tone
      const agentConfigService = new AgentConfigService(
        new AgentConfigRepository(),
      );
      const instructions = await agentConfigService.getEffectiveInstructions(
        { userId: "" } as any,
        profileData.id,
        profileData.displayName || "el profesional",
      );

      // Build context for the agent
      const agentContext = new Map([
        ["userPhone", phone],
        ["channel", "whatsapp"],
        ["profileDisplayName", profileData.displayName || "el profesional"],
        ["profileTitle", profileData.title || ""],
        ["profileBio", profileData.bio || ""],
        ["profileId", profileData.id],
        ["conversationId", conversationId],
      ]);

      // Build full message with profile context
      const profileContext = `Información del profesional que atienden:
- Nombre: ${profileData.displayName || "el profesional"}
- ID del Perfil: ${profileData.id}
${profileData.title ? `- Título: ${profileData.title}` : ""}
${profileData.bio ? `- Bio: ${profileData.bio}` : ""}

Este usuario te contacta por WhatsApp.

`;

      const fullMessage = `${profileContext}${text}`;

      try {
        // Get the medical chat agent
        const agent = getMedicalChatAgent();

        // Generate response using the agent
        const result = await agent.generateText(fullMessage, {
          conversationId,
          context: agentContext,
        });

        // Convert structured response to WhatsApp format
        const whatsappResponse = convertToWhatsAppResponse(result.text);

        // Save assistant message to context
        await contextRepository.addMessage(
          phone,
          "assistant",
          whatsappResponse.text,
        );

        // Send response via Evolution API
        await evolutionService.sendText(instance, {
          number: phone,
          text: whatsappResponse.text,
        });

        // If should transfer to web, send the link
        if (whatsappResponse.shouldTransferToWeb) {
          const transferUrl = generateTransferUrl(profileData.username, phone);
          await contextRepository.markTransferredToWidget(phone);

          // Send transfer message with a small delay
          setTimeout(async () => {
            await evolutionService.sendText(instance, {
              number: phone,
              text: `\n\nPara continuar con más opciones y agendar tu cita, visita nuestro chat interactivo:\n${transferUrl}`,
            });
          }, 2000);
        }

        return {
          success: true,
          answered: true,
          messageId: data.key.id,
        };
      } catch (agentError) {
        console.error("Agent error:", agentError);

        // Fallback to simple response if agent fails
        const fallbackMessage =
          "Gracias por tu mensaje. Estoy procesando tu solicitud. Para una mejor atención, te recomiendo continuar en nuestro chat web donde podrás agendar tu cita con calma.";

        const transferUrl = generateTransferUrl(profileData.username, phone);

        await contextRepository.addMessage(phone, "assistant", fallbackMessage);
        await contextRepository.markTransferredToWidget(phone);

        await evolutionService.sendText(instance, {
          number: phone,
          text: `${fallbackMessage}\n\n${transferUrl}`,
        });

        return {
          success: true,
          fallback: true,
          messageId: data.key.id,
        };
      }
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
