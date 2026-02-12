import { Elysia, t } from "elysia";
import {
  AgentConfigService,
  TONE_PRESETS,
} from "../../services/business/agent-config";
import type { TonePreset, AgentConfigData } from "../../db/schema/agent-config";
import { AgentConfigRepository } from "../../services/repository/agent-config";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

/**
 * Agent Config API routes
 */
export const agentConfigRoutes = new Elysia({ prefix: "/agent" })
  .use(errorMiddleware)
  .use(authGuard)
  .derive(() => {
    const agentConfigRepository = new AgentConfigRepository();
    const agentConfigService = new AgentConfigService(agentConfigRepository);
    return { agentConfigService };
  })
  .get(
    "/config",
    async ({ query, ctx, agentConfigService, set }) => {
      try {
        const { profileId } = query;

        if (!profileId) {
          set.status = 400;
          return { error: "profileId is required" };
        }

        let config = await agentConfigService.getConfig(ctx, profileId);

        // Auto-create config if it doesn't exist
        if (!config) {
          config = await agentConfigService.createConfig(ctx, profileId);
        }

        return {
          success: true,
          data: {
            id: config.id,
            profileId: config.profileId,
            tonePreset: config.tonePreset,
            customInstructions: config.customInstructions,
            welcomeMessage: config.welcomeMessage,
            farewellMessage: config.farewellMessage,
            suggestions: config.suggestions,
            widgetEnabled: config.widgetEnabled,
            widgetPosition: config.widgetPosition,
            widgetPrimaryColor: config.widgetPrimaryColor,
            whatsappEnabled: config.whatsappEnabled,
            whatsappAutoTransfer: config.whatsappAutoTransfer,
            whatsappMaxMessageLength: config.whatsappMaxMessageLength,
          },
        };
      } catch (error) {
        console.error("Error getting agent config:", error);
        set.status = 500;
        return {
          error: "Failed to get agent config",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        profileId: t.String(),
      }),
    },
  )
  .put(
    "/config",
    async ({ body, ctx, agentConfigService, set }) => {
      try {
        const { profileId, ...data } = body as AgentConfigData & {
          profileId: string;
        };

        if (!profileId) {
          set.status = 400;
          return { error: "profileId is required" };
        }

        const config = await agentConfigService.updateConfig(
          ctx,
          profileId,
          data,
        );

        return {
          success: true,
          data: {
            id: config.id,
            profileId: config.profileId,
            tonePreset: config.tonePreset,
            customInstructions: config.customInstructions,
            welcomeMessage: config.welcomeMessage,
            farewellMessage: config.farewellMessage,
            suggestions: config.suggestions,
            widgetEnabled: config.widgetEnabled,
            widgetPosition: config.widgetPosition,
            widgetPrimaryColor: config.widgetPrimaryColor,
            whatsappEnabled: config.whatsappEnabled,
            whatsappAutoTransfer: config.whatsappAutoTransfer,
            whatsappMaxMessageLength: config.whatsappMaxMessageLength,
          },
        };
      } catch (error) {
        console.error("Error updating agent config:", error);
        set.status = 500;
        return {
          error: "Failed to update agent config",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        profileId: t.String(),
        tonePreset: t.Optional(
          t.Enum({
            formal: "formal",
            professional: "professional",
            friendly: "friendly",
          }),
        ),
        customInstructions: t.Optional(t.String()),
        welcomeMessage: t.Optional(t.String()),
        farewellMessage: t.Optional(t.String()),
        suggestions: t.Optional(t.Array(t.String())),
        widgetEnabled: t.Optional(t.Boolean()),
        widgetPosition: t.Optional(
          t.Enum({
            "bottom-right": "bottom-right",
            "bottom-left": "bottom-left",
          }),
        ),
        widgetPrimaryColor: t.Optional(t.String()),
        whatsappEnabled: t.Optional(t.Boolean()),
        whatsappAutoTransfer: t.Optional(t.Boolean()),
        whatsappMaxMessageLength: t.Optional(t.Number()),
      }),
    },
  )
  .get("/tone-presets", async () => {
    return {
      success: true,
      data: Object.entries(TONE_PRESETS).map(([key, value]) => ({
        id: key,
        description: value.description,
      })),
    };
  })
  .get(
    "/suggestions",
    async ({ query, ctx, agentConfigService, set }) => {
      try {
        const { profileId } = query;

        if (!profileId) {
          set.status = 400;
          return { error: "profileId is required" };
        }

        const suggestions = await agentConfigService.getSuggestions(
          ctx,
          profileId,
        );

        return {
          success: true,
          data: suggestions,
        };
      } catch (error) {
        console.error("Error getting suggestions:", error);
        set.status = 500;
        return {
          error: "Failed to get suggestions",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        profileId: t.String(),
      }),
    },
  );
