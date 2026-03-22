import { Elysia, t } from "elysia";
import { createMedicalChatAgent } from "../../services/ai/chat";
import { getConversationHistory } from "../../services/ai/chat/memory/history";
import { ProfileRepository } from "../../services/repository/profile";
import { AgentConfigRepository } from "../../services/repository/agent-config";
import { AgentConfigService } from "../../services/business/agent-config";
import {
  parseStructuredResponse,
  extractStructuredParts,
} from "../../services/ai/chat/parser";
import type { AIMessagePart } from "../../services/ai/chat/schema";
import { getMessageStrategy } from "../../services/ai/messaging";
import { getChatInstructions } from "../../services/ai/chat/config";
import type { ToolCategory } from "../../db/schema/profile";
import {
  agentRateLimit,
  agentStreamRateLimit,
} from "../../middleware/rate-limit";

const profileRepository = new ProfileRepository();
const agentConfigRepository = new AgentConfigRepository();
const agentConfigService = new AgentConfigService(agentConfigRepository);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ProfileIdSchema = t.Optional(
  t.String({
    pattern: UUID_REGEX.source,
    error: "profileId must be a valid UUID",
  }),
);

/**
 * Agent API routes for AI chat functionality
 * Compatible with AI SDK useChat transport
 */
export const agentRoutes = new Elysia({ prefix: "/agent" })
  .use(agentRateLimit())
  .post(
    "/chat",
    async ({ body, set }) => {
      try {
        const { message, phone, conversationId, profileId } = body;

        if (!message) {
          set.status = 400;
          return { error: "Message is required" };
        }

        // Generate conversationId if not provided
        const finalConversationId =
          conversationId ||
          `webchat:${profileId || "unknown"}:${crypto.randomUUID()}`;

        // Fetch profile data for dynamic context
        let profileInfo = {
          displayName: "el profesional",
          title: "",
          bio: "",
        };

        let toneInstructions: string | undefined;
        let enabledToolCategories: ToolCategory[] | undefined;

        if (profileId) {
          const profile = await profileRepository.findById(profileId);
          if (profile) {
            profileInfo = {
              displayName: profile.displayName || "el profesional",
              title: profile.title || "",
              bio: profile.bio || "",
            };

            // Get tone instructions from agent config
            toneInstructions =
              await agentConfigService.getEffectiveInstructionsForAgent(
                profileId,
                profile.displayName || "el profesional",
              );

            // Get enabled tool categories from profile features
            if (profile.featuresConfig?.enabledToolCategories) {
              enabledToolCategories =
                profile.featuresConfig.enabledToolCategories;
            }
          }
        }

        // Create agent with dynamic instructions and filtered tools
        const instructions = getChatInstructions({
          displayName: profileInfo.displayName,
          title: profileInfo.title,
          bio: profileInfo.bio,
          toneInstructions,
        });
        const agent = createMedicalChatAgent({
          instructions,
          enabledToolCategories,
        });
        const strategy = getMessageStrategy("webchat");

        // Build profile context message
        const profileContext = `Información del profesional que atienden:
- Nombre: ${profileInfo.displayName}
- ID del Perfil: ${profileId || "unknown"}
${profileInfo.title ? `- Título: ${profileInfo.title}` : ""}
${profileInfo.bio ? `- Bio: ${profileInfo.bio}` : ""}

`;
        // Prepend profile context to the user message
        const fullMessage = `${profileContext}${message}`;

        // Generate response with the agent
        const result = await agent.generateText(fullMessage, {
          conversationId: finalConversationId,
          context: new Map([
            ["userPhone", phone || "unknown"],
            ["channel", "webchat"],
            ["profileDisplayName", profileInfo.displayName],
            ["profileTitle", profileInfo.title],
            ["profileBio", profileInfo.bio],
            ["supportsRichComponents", "true"],
          ]),
        });

        // Format response using strategy
        const formatted = strategy.formatResponse(result.text);

        return {
          success: true,
          text: formatted.text,
          usage: result.usage,
          parts: formatted.parts,
          hasStructuredResponse: formatted.hasStructuredResponse,
          conversationId: finalConversationId,
        };
      } catch (error) {
        console.error("Agent chat error:", error);
        set.status = 500;
        return {
          error: "Failed to process message",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        phone: t.Optional(t.String()),
        conversationId: t.Optional(t.String()),
        profileId: ProfileIdSchema,
      }),
    },
  )
  .post(
    "/stream",
    async ({ body, set }) => {
      try {
        const { message, phone, conversationId, profileId } = body;

        if (!message) {
          set.status = 400;
          return { error: "Message is required" };
        }

        // Generate conversationId if not provided
        const finalConversationId =
          conversationId ||
          `webchat:${profileId || "unknown"}:${crypto.randomUUID()}`;

        // Fetch profile data for dynamic context
        let profileInfo = {
          displayName: "el profesional",
          title: "",
          bio: "",
        };

        let toneInstructions: string | undefined;
        let enabledToolCategories: ToolCategory[] | undefined;

        if (profileId) {
          const profile = await profileRepository.findById(profileId);
          if (profile) {
            profileInfo = {
              displayName: profile.displayName || "el profesional",
              title: profile.title || "",
              bio: profile.bio || "",
            };

            // Get tone instructions from agent config
            toneInstructions =
              await agentConfigService.getEffectiveInstructionsForAgent(
                profileId,
                profile.displayName || "el profesional",
              );

            // Get enabled tool categories from profile features
            if (profile.featuresConfig?.enabledToolCategories) {
              enabledToolCategories =
                profile.featuresConfig.enabledToolCategories;
            }
          }
        }

        // Create agent with dynamic instructions and filtered tools
        const instructions = getChatInstructions({
          displayName: profileInfo.displayName,
          title: profileInfo.title,
          bio: profileInfo.bio,
          toneInstructions,
        });
        const agent = createMedicalChatAgent({
          instructions,
          enabledToolCategories,
        });

        // Build profile context message
        const profileContext = `Información del profesional que atienden:
- Nombre: ${profileInfo.displayName}
- ID del Perfil: ${profileId || "unknown"}
${profileInfo.title ? `- Título: ${profileInfo.title}` : ""}
${profileInfo.bio ? `- Bio: ${profileInfo.bio}` : ""}

`;

        // Prepend profile context to the user message
        const fullMessage = `${profileContext}${message}`;

        // Stream response
        const stream = await agent.streamText(fullMessage, {
          conversationId: finalConversationId,
          context: new Map([
            ["userPhone", phone || "unknown"],
            ["channel", "web"],
            ["profileDisplayName", profileInfo.displayName],
            ["profileTitle", profileInfo.title],
            ["profileBio", profileInfo.bio],
          ]),
        });

        // Return SSE stream for AI SDK compatibility
        const readable = new ReadableStream({
          async start(controller) {
            try {
              // Send conversationId at the start of the stream
              controller.enqueue(
                `data: ${JSON.stringify({ type: "conversation-id", conversationId: finalConversationId })}\n\n`,
              );

              let accumulatedText = "";

              for await (const chunk of stream.fullStream) {
                // Accumulate text chunks for structured parsing
                const chunkData = chunk as {
                  type: string;
                  text?: string;
                  textDelta?: string;
                };
                if (chunk.type === "text-delta") {
                  accumulatedText +=
                    chunkData.text || chunkData.textDelta || "";
                }

                // Forward the chunk as-is for compatibility
                const data = JSON.stringify(chunk);
                controller.enqueue(`data: ${data}\n\n`);
              }

              // After stream completes, send structured parts if available
              const structuredParts = extractStructuredParts(accumulatedText);
              if (structuredParts) {
                const structuredData = JSON.stringify({
                  type: "structured-parts",
                  parts: structuredParts,
                });
                controller.enqueue(`data: ${structuredData}\n\n`);
              }

              controller.enqueue(`data: [DONE]\n\n`);
            } catch (error) {
              controller.error(error);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.error("Agent streaming error:", error);
        set.status = 500;
        return {
          error: "Failed to stream response",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        phone: t.Optional(t.String()),
        conversationId: t.Optional(t.String()),
        profileId: ProfileIdSchema,
      }),
    },
  )
  .post(
    "/escalate",
    async ({ body, set }) => {
      try {
        const { phone, reason, conversationId } = body;

        console.log(`Escalating conversation for phone ${phone}: ${reason}`);

        return {
          success: true,
          message: "Conversation escalated to human agent",
          ticketId: `ticket-${Date.now()}`,
        };
      } catch (error) {
        console.error("Escalation error:", error);
        set.status = 500;
        return {
          error: "Failed to escalate conversation",
        };
      }
    },
    {
      body: t.Object({
        phone: t.String(),
        reason: t.String(),
        conversationId: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/conversations/:conversationId",
    async ({ params, set }) => {
      try {
        const { conversationId } = params;

        if (!conversationId) {
          set.status = 400;
          return { error: "conversationId is required" };
        }

        const messages = await getConversationHistory(conversationId);

        return {
          success: true,
          conversationId,
          messages,
        };
      } catch (error) {
        console.error("Error loading conversation:", error);
        set.status = 500;
        return {
          error: "Failed to load conversation",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
    },
  );
