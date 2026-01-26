import { Elysia, t } from "elysia";
import { getMedicalChatAgent } from "../../services/ai/chat";
import { ProfileRepository } from "../../services/repository/profile";
import {
  parseStructuredResponse,
  extractStructuredParts,
} from "../../services/ai/chat/parser";
import type { AIMessagePart } from "../../services/ai/chat/schema";

const profileRepository = new ProfileRepository();

/**
 * Agent API routes for AI chat functionality
 * Compatible with AI SDK useChat transport
 */
export const agentRoutes = new Elysia({ prefix: "/agent" })
  .post(
    "/chat",
    async ({ body, set }) => {
      try {
        const { message, phone, conversationId, profileId } = body;

        if (!message) {
          set.status = 400;
          return { error: "Message is required" };
        }

        // Fetch profile data for dynamic context
        let profileInfo = {
          displayName: "el profesional",
          title: "",
          bio: "",
        };

        if (profileId) {
          const profile = await profileRepository.findById(profileId);
          if (profile) {
            profileInfo = {
              displayName: profile.displayName || "el profesional",
              title: profile.title || "",
              bio: profile.bio || "",
            };
          }
        }

        const agent = getMedicalChatAgent();

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
          conversationId,
          context: new Map([
            ["userPhone", phone || "unknown"],
            ["channel", "web"],
            ["profileDisplayName", profileInfo.displayName],
            ["profileTitle", profileInfo.title],
            ["profileBio", profileInfo.bio],
          ]),
        });

        // Try to extract structured parts from the response
        const structuredParts = extractStructuredParts(result.text);

        return {
          success: true,
          text: result.text,
          usage: result.usage,
          parts: structuredParts || null,
          hasStructuredResponse: structuredParts !== null,
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
        profileId: t.Optional(t.String()),
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

        // Fetch profile data for dynamic context
        let profileInfo = {
          displayName: "el profesional",
          title: "",
          bio: "",
        };

        if (profileId) {
          const profile = await profileRepository.findById(profileId);
          if (profile) {
            profileInfo = {
              displayName: profile.displayName || "el profesional",
              title: profile.title || "",
              bio: profile.bio || "",
            };
          }
        }

        const agent = getMedicalChatAgent();

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
          conversationId,
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
        profileId: t.Optional(t.String()),
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
  );
