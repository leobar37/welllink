import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { WhatsAppContextStatus } from "../../db/schema/whatsapp-context";
import { db } from "../../db";
import { whatsappContext } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Conversations API routes for managing WhatsApp conversation sessions
 * Includes filtering by status (active, paused, transferred)
 */
export const conversationsRoutes = new Elysia({ prefix: "/conversations" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive(({ ctx }) => {
    // Access services from the plugin
    const services = (ctx as any).services;
    return { services, ctx };
  })
  .get(
    "/",
    async ({ query, services, ctx }) => {
      const profileId = query.profileId;

      if (!profileId) {
        // Get the user's primary profile
        const profiles = await services.profileRepository.findByUser(
          ctx!,
          ctx!.userId,
        );
        if (!profiles || profiles.length === 0) {
          return { conversations: [], total: 0 };
        }
        // Use the first profile if none specified
        const primaryProfile = profiles[0];

        if (query.status) {
          const contexts =
            await services.whatsappContextRepository.findByProfileAndStatus(
              primaryProfile.id,
              query.status,
            );
          return {
            conversations: contexts,
            total: contexts.length,
            status: query.status,
          };
        } else {
          const contexts =
            await services.whatsappContextRepository.findByProfile(
              primaryProfile.id,
              parseInt(query.limit || "50"),
            );
          return {
            conversations: contexts,
            total: contexts.length,
          };
        }
      }

      if (query.status) {
        const contexts =
          await services.whatsappContextRepository.findByProfileAndStatus(
            profileId,
            query.status,
          );
        return {
          conversations: contexts,
          total: contexts.length,
          status: query.status,
        };
      }

      const contexts = await services.whatsappContextRepository.findByProfile(
        profileId,
        parseInt(query.limit || "50"),
      );
      return {
        conversations: contexts,
        total: contexts.length,
      };
    },
    {
      query: t.Object({
        profileId: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal(WhatsAppContextStatus.ACTIVE),
            t.Literal(WhatsAppContextStatus.PAUSED_FOR_HUMAN),
            t.Literal(WhatsAppContextStatus.TRANSFERRED_TO_WIDGET),
          ]),
        ),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .get("/paused", async ({ ctx, services }) => {
    // Get all profiles for the user
    const profiles = await services.profileRepository.findByUser(
      ctx!,
      ctx!.userId,
    );
    if (!profiles || profiles.length === 0) {
      return { conversations: [], total: 0 };
    }

    const allPaused: any[] = [];
    for (const profile of profiles) {
      const paused =
        await services.whatsappContextRepository.findByProfileAndStatus(
          profile.id,
          WhatsAppContextStatus.PAUSED_FOR_HUMAN,
        );
      allPaused.push(
        ...paused.map((c: any) => ({
          ...c,
          profileName: profile.displayName,
        })),
      );
    }

    return {
      conversations: allPaused,
      total: allPaused.length,
      status: "PAUSED_FOR_HUMAN",
    };
  })
  .get("/:phone", async ({ params, services }) => {
    const context = await services.whatsappContextRepository.findByPhone(
      params.phone,
    );

    if (!context) {
      return { error: "Conversation not found" };
    }

    return context;
  })
  .post("/:phone/pause", async ({ params, services }) => {
    await services.whatsappContextRepository.markPausedForHuman(params.phone);

    const context = await services.whatsappContextRepository.findByPhone(
      params.phone,
    );
    return { success: true, context };
  })
  .post("/:phone/resume", async ({ params, services }) => {
    const context = await services.whatsappContextRepository.findByPhone(
      params.phone,
    );
    if (!context) {
      return { error: "Conversation not found" };
    }

    // Resume by setting back to ACTIVE
    await db
      .update(whatsappContext)
      .set({
        status: WhatsAppContextStatus.ACTIVE,
        updatedAt: new Date(),
      })
      .where(eq(whatsappContext.phone, params.phone));

    return { success: true };
  });
