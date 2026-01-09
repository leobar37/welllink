import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { WhatsAppConfigService } from "../../services/business/whatsapp-config";
import { WhatsAppService } from "../../services/business/whatsapp";
import { WhatsAppTemplateService } from "../../services/business/whatsapp-template";
import { WhatsAppConfigRepository } from "../../services/repository/whatsapp-config";
import { WhatsAppMessageRepository } from "../../services/repository/whatsapp-message";
import { WhatsAppTemplateRepository } from "../../services/repository/whatsapp-template";
import { ProfileRepository } from "../../services/repository/profile";
import { EvolutionService } from "../../services/business/evolution-api";
import {
  MessageStatus,
  TemplateCategory,
  TemplateStatus,
} from "../../db/schema";

export const whatsappRoutes = new Elysia({ prefix: "/whatsapp" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "global" }, () => {
    // Initialize repositories and services with DI
    const profileRepository = new ProfileRepository();
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const whatsappMessageRepository = new WhatsAppMessageRepository();
    const whatsappTemplateRepository = new WhatsAppTemplateRepository();

    const evolutionService = new EvolutionService({
      baseUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
      apiKey: process.env.EVOLUTION_API_KEY || "",
    });

    const whatsappConfigService = new WhatsAppConfigService(
      whatsappConfigRepository,
      evolutionService,
    );

    const whatsappService = new WhatsAppService(
      whatsappMessageRepository,
      whatsappConfigRepository,
      evolutionService,
    );

    const whatsappTemplateService = new WhatsAppTemplateService(
      whatsappTemplateRepository,
      whatsappConfigRepository,
      evolutionService,
    );

    return {
      profileRepository,
      whatsappConfigService,
      whatsappService,
      whatsappTemplateService,
      whatsappConfigRepository,
      whatsappMessageRepository,
      whatsappTemplateRepository,
      evolutionService,
    };
  })

  // WhatsApp Configuration Routes
  .group("/configs", (group) =>
    group
      .get("/", async ({ ctx, whatsappConfigService, profileRepository }) => {
        // Get all configs for user's profiles
        const profiles = await profileRepository.findByUser(ctx!, ctx!.userId);
        if (!profiles) return [];

        const allConfigs = [];
        for (const profile of profiles) {
          const configs = await whatsappConfigService.getConfigsByProfile(
            ctx!,
            profile.id,
          );
          allConfigs.push(...configs);
        }
        return allConfigs;
      })
      .get("/get-or-create", async ({ ctx, whatsappConfigRepository, profileRepository }) => {
        // Direct query without relations to avoid the Drizzle relation error
        const { db } = await import("../../db");
        const { profile } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");

        // Get profiles without relations to avoid the relation error
        const profiles = await db.query.profile.findMany({
          where: eq(profile.userId, ctx!.userId),
        });

        if (!profiles || profiles.length === 0) {
          throw new Error("No profiles found for user");
        }

        // Check if user already has configs
        const allConfigs = [];
        for (const profileRecord of profiles) {
          const configs = await whatsappConfigRepository.findByProfile(
            ctx!,
            profileRecord.id,
          );
          allConfigs.push(...configs);
        }

        if (allConfigs.length > 0) {
          return allConfigs[0]; // Return first existing config
        }

        // No config found, create a default one for the first profile
        const firstProfile = profiles[0];
        const instanceName = `${firstProfile.username || firstProfile.displayName || 'whatsapp'}-${Date.now()}`;

        // Create a basic config without Evolution API (for now)
        const basicConfig = {
          profileId: firstProfile.id,
          instanceName,
          instanceId: instanceName, // Use instanceName as instanceId for now
          token: "",
          webhookUrl: "",
          isEnabled: false,
          isConnected: false,
          config: {
            instanceName,
            instanceId: instanceName,
            token: "",
            webhookUrl: "",
            qrcode: true,
            webhook: {
              enabled: false,
              url: "",
              events: [],
            },
            chatbot: {
              enabled: false,
              ignoreGroups: true,
              ignoreBroadcast: true,
            },
          },
        };

        return await whatsappConfigRepository.create(ctx!, basicConfig);
      })
      .post(
        "/",
        async ({ body, set, ctx, whatsappConfigService }) => {
          const config = await whatsappConfigService.createConfig(ctx!, body);
          set.status = 201;
          return config;
        },
        {
          body: t.Object({
            profileId: t.String(),
            instanceName: t.String({ minLength: 1 }),
            config: t.Object({
              token: t.Optional(t.String()),
              webhook: t.Optional(
                t.Object({
                  enabled: t.Boolean(),
                  url: t.String(),
                  events: t.Array(t.String()),
                }),
              ),
              chatbot: t.Optional(
                t.Object({
                  enabled: t.Boolean(),
                  ignoreGroups: t.Boolean(),
                  ignoreBroadcast: t.Boolean(),
                }),
              ),
            }),
          }),
        },
      )
      .get("/:id", async ({ params, ctx, whatsappConfigService }) => {
        return whatsappConfigService.getConfig(ctx!, params.id);
      })
      .put(
        "/:id",
        async ({ params, body, ctx, whatsappConfigService }) => {
          return whatsappConfigService.updateConfig(ctx!, params.id, body);
        },
        {
          body: t.Object({
            instanceName: t.Optional(t.String()),
            isEnabled: t.Optional(t.Boolean()),
            webhookUrl: t.Optional(t.String()),
            config: t.Optional(
              t.Object({
                token: t.Optional(t.String()),
                webhook: t.Optional(
                  t.Object({
                    enabled: t.Boolean(),
                    url: t.String(),
                    events: t.Array(t.String()),
                  }),
                ),
                chatbot: t.Optional(
                  t.Object({
                    enabled: t.Boolean(),
                    ignoreGroups: t.Boolean(),
                    ignoreBroadcast: t.Boolean(),
                  }),
                ),
              }),
            ),
          }),
        },
      )
      .delete("/:id", async ({ params, ctx, set, whatsappConfigService }) => {
        await whatsappConfigService.deleteConfig(ctx!, params.id);
        set.status = 204;
      })
      .post("/:id/connect", async ({ params, ctx, whatsappConfigRepository }) => {
        // Direct database query to avoid relation issues
        const { db } = await import("../../db");
        const { whatsappConfig, profile } = await import("../../db/schema");
        const { eq, and } = await import("drizzle-orm");

        const config = await db.query.whatsappConfig.findFirst({
          where: eq(whatsappConfig.id, params.id),
        });

        if (!config) {
          throw new Error("WhatsApp configuration not found");
        }

        // Verify ownership
        const ownerProfile = await db.query.profile.findFirst({
          where: and(
            eq(profile.id, config.profileId),
            eq(profile.userId, ctx!.userId)
          ),
        });

        if (!ownerProfile) {
          throw new Error("Access denied");
        }

        // Since Evolution API is not running, return a mock response
        return {
          qrcode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          instanceName: config.instanceName,
          message: "Evolution API no está disponible. Inicia el servidor para generar un código QR real.",
        };
      })
      .post(
        "/:id/disconnect",
        async ({ params, ctx, whatsappConfigService }) => {
          return whatsappConfigService.disconnectInstance(ctx!, params.id);
        },
      )
      .get("/:id/status", async ({ params, ctx, whatsappConfigService }) => {
        return whatsappConfigService.checkConnectionStatus(ctx!, params.id);
      })
      .get("/:id/info", async ({ params, ctx, whatsappConfigService }) => {
        return whatsappConfigService.getInstanceInfo(ctx!, params.id);
      })
      .patch(
        "/:id/toggle",
        async ({ params, body, ctx, whatsappConfigService }) => {
          return whatsappConfigService.toggleInstance(
            ctx!,
            params.id,
            body.isEnabled,
          );
        },
        {
          body: t.Object({
            isEnabled: t.Boolean(),
          }),
        },
      ),
  )

  // WhatsApp Message Routes
  .group("/messages", (group) =>
    group
      .get(
        "/:configId",
        async ({ params, query, ctx, whatsappService }) => {
          const limit = parseInt(query.limit || "50");
          const offset = parseInt(query.offset || "0");
          return whatsappService.getMessages(
            ctx!,
            params.configId,
            limit,
            offset,
          );
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
        },
      )
      .post(
        "/:configId/send",
        async ({ params, body, set, ctx, whatsappService }) => {
          const message = await whatsappService.sendMessage(
            ctx!,
            params.configId,
            body,
          );
          set.status = 201;
          return message;
        },
        {
          body: t.Object({
            to: t.String(),
            content: t.String(),
            delay: t.Optional(t.Number()),
            presence: t.Optional(t.String()),
            quotedMessage: t.Optional(t.Any()),
          }),
        },
      )
      .post(
        "/:configId/send-media",
        async ({ params, body, set, ctx, whatsappService }) => {
          const message = await whatsappService.sendMedia(
            ctx!,
            params.configId,
            body,
          );
          set.status = 201;
          return message;
        },
        {
          body: t.Object({
            to: t.String(),
            mediatype: t.Union([
              t.Literal("image"),
              t.Literal("video"),
              t.Literal("document"),
              t.Literal("audio"),
            ]),
            media: t.String(),
            fileName: t.Optional(t.String()),
            caption: t.Optional(t.String()),
            mimetype: t.Optional(t.String()),
            delay: t.Optional(t.Number()),
          }),
        },
      )
      .post(
        "/:configId/send-template",
        async ({ params, body, set, ctx, whatsappService }) => {
          const message = await whatsappService.sendTemplate(
            ctx!,
            params.configId,
            body,
          );
          set.status = 201;
          return message;
        },
        {
          body: t.Object({
            to: t.String(),
            templateName: t.String(),
            components: t.Array(t.Any()),
          }),
        },
      )
      .get(
        "/:configId/conversation/:phone",
        async ({ params, query, ctx, whatsappService }) => {
          const limit = parseInt(query.limit || "50");
          return whatsappService.getConversation(
            ctx!,
            params.configId,
            params.phone,
            limit,
          );
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/:configId/conversations",
        async ({ params, ctx, whatsappService }) => {
          return whatsappService.getConversationList(ctx!, params.configId);
        },
      )
      .get(
        "/:configId/stats",
        async ({ params, query, ctx, whatsappService }) => {
          const startDate = query.startDate
            ? new Date(query.startDate)
            : undefined;
          const endDate = query.endDate ? new Date(query.endDate) : undefined;
          return whatsappService.getMessageStats(
            ctx!,
            params.configId,
            startDate,
            endDate,
          );
        },
        {
          query: t.Object({
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String()),
          }),
        },
      ),
  )
  // Retry route outside the group to avoid parameter conflict
  .post(
    "/messages/retry/:messageId",
    async ({ params, ctx, whatsappService }) => {
      return whatsappService.retryFailedMessage(ctx!, params.messageId);
    },
  )

  // WhatsApp Template Routes
  .group("/templates", (group) =>
    group
      .get("/:configId", async ({ params, ctx, whatsappTemplateService }) => {
        return whatsappTemplateService.getTemplatesByConfig(
          ctx!,
          params.configId,
        );
      })
      .get(
        "/:configId/active",
        async ({ params, ctx, whatsappTemplateService }) => {
          return whatsappTemplateService.getActiveTemplates(
            ctx!,
            params.configId,
          );
        },
      )
      .get(
        "/:configId/category/:category",
        async ({ params, ctx, whatsappTemplateService }) => {
          return whatsappTemplateService.getTemplatesByCategory(
            ctx!,
            params.configId,
            params.category as TemplateCategory,
          );
        },
      )
      .post(
        "/",
        async ({ body, set, ctx, whatsappTemplateService }) => {
          const template = await whatsappTemplateService.createTemplate(
            ctx!,
            body,
          );
          set.status = 201;
          return template;
        },
        {
          body: t.Object({
            configId: t.String(),
            name: t.String(),
            displayName: t.String(),
            category: t.Union([
              t.Literal(TemplateCategory.MARKETING),
              t.Literal(TemplateCategory.UTILITY),
              t.Literal(TemplateCategory.AUTHENTICATION),
            ]),
            language: t.Optional(t.String()),
            components: t.Array(t.Any()),
            variables: t.Optional(t.Array(t.Any())),
            submitToWhatsApp: t.Optional(t.Boolean()),
          }),
        },
      ),
  )
  // Routes with :id parameter outside the group to avoid conflict
  .get(
    "/templates/by-id/:id",
    async ({ params, ctx, whatsappTemplateService }) => {
      return whatsappTemplateService.getTemplate(ctx!, params.id);
    },
  )
  .put(
    "/templates/by-id/:id",
    async ({ params, body, ctx, whatsappTemplateService }) => {
      return whatsappTemplateService.updateTemplate(ctx!, params.id, body);
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        displayName: t.Optional(t.String()),
        category: t.Optional(
          t.Union([
            t.Literal(TemplateCategory.MARKETING),
            t.Literal(TemplateCategory.UTILITY),
            t.Literal(TemplateCategory.AUTHENTICATION),
          ]),
        ),
        language: t.Optional(t.String()),
        components: t.Optional(t.Array(t.Any())),
        variables: t.Optional(t.Array(t.Any())),
      }),
    },
  )
  .delete(
    "/templates/by-id/:id",
    async ({ params, set, ctx, whatsappTemplateService }) => {
      await whatsappTemplateService.deleteTemplate(ctx!, params.id);
      set.status = 204;
    },
  )
  .post(
    "/templates/by-id/:id/submit",
    async ({ params, ctx, whatsappTemplateService }) => {
      return whatsappTemplateService.submitTemplateToWhatsApp(ctx!, params.id);
    },
  )
  .patch(
    "/templates/by-id/:id/toggle",
    async ({ params, body, ctx, whatsappTemplateService }) => {
      return whatsappTemplateService.toggleTemplate(
        ctx!,
        params.id,
        body.isEnabled,
      );
    },
    {
      body: t.Object({
        isEnabled: t.Boolean(),
      }),
    },
  )

  // Webhook endpoint for Evolution API
  .post(
    "/webhook/:instanceName",
    async ({ params, body, ctx, whatsappService }) => {
      await whatsappService.handleWebhook(ctx!, params.instanceName, body);
      return { status: "ok" };
    },
    {
      body: t.Any(),
    },
  );
