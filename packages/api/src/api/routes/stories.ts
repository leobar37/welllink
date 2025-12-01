import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

const storyTypeSchema = t.Union([t.Literal("self"), t.Literal("client")]);
const eventTypeSchema = t.Union([
  t.Literal("section_viewed"),
  t.Literal("story_changed"),
  t.Literal("text_opened"),
  t.Literal("cta_clicked"),
]);

export const storiesRoutes = new Elysia({ prefix: "/stories" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  // Public event ingestion endpoint
  .post(
    "/events",
    async ({ body, services, request, set }) => {
      await services.storyService.trackEvent({
        profileId: body.profileId,
        storyId: body.storyId ?? undefined,
        eventType: body.eventType,
        metadata: {
          ...(body.metadata || {}),
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });

      set.status = 202;
      return { ok: true };
    },
    {
      body: t.Object({
        profileId: t.String({ minLength: 1 }),
        storyId: t.Optional(t.String()),
        eventType: eventTypeSchema,
        metadata: t.Optional(t.Record(t.String(), t.Optional(t.Unknown()))),
      }),
    },
  )
  // Protected routes for advisors
  .use(authGuard)
  .get("/profile/:profileId", async ({ params, ctx, services }) => {
    return services.storyService.getDashboardData(ctx!, params.profileId);
  })
  .put(
    "/profile/:profileId/config",
    async ({ params, body, ctx, services }) => {
      return services.storyService.upsertSection(ctx!, params.profileId, body);
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
        intro: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
        ctaLabel: t.Optional(t.Nullable(t.String({ maxLength: 120 }))),
        ctaUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
      }),
    },
  )
  .post(
    "/profile/:profileId",
    async ({ params, body, ctx, services, set }) => {
      const story = await services.storyService.createStory(
        ctx!,
        params.profileId,
        body,
      );
      set.status = 201;
      return story;
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 160 }),
        type: storyTypeSchema,
        beforeAssetId: t.String({ minLength: 1 }),
        afterAssetId: t.String({ minLength: 1 }),
        text: t.Optional(t.String({ maxLength: 2000 })),
        isPublished: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/:storyId",
    async ({ params, body, ctx, services }) => {
      return services.storyService.updateStory(ctx!, params.storyId, body);
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 160 })),
        type: t.Optional(storyTypeSchema),
        beforeAssetId: t.Optional(t.String({ minLength: 1 })),
        afterAssetId: t.Optional(t.String({ minLength: 1 })),
        text: t.Optional(t.String({ maxLength: 2000 })),
        isPublished: t.Optional(t.Boolean()),
      }),
    },
  )
  .patch(
    "/:storyId/publish",
    async ({ params, body, ctx, services }) => {
      return services.storyService.togglePublish(
        ctx!,
        params.storyId,
        body.isPublished,
      );
    },
    {
      body: t.Object({
        isPublished: t.Boolean(),
      }),
    },
  )
  .patch(
    "/reorder",
    async ({ body, ctx, services }) => {
      return services.storyService.reorderStories(
        ctx!,
        body.profileId,
        body.items,
      );
    },
    {
      body: t.Object({
        profileId: t.String({ minLength: 1 }),
        items: t.Array(
          t.Object({
            id: t.String({ minLength: 1 }),
            order: t.Number(),
          }),
          { minItems: 1, maxItems: 10 },
        ),
      }),
    },
  )
  .delete("/:storyId", async ({ params, ctx, services, set }) => {
    await services.storyService.deleteStory(ctx!, params.storyId);
    set.status = 204;
  })
  .get(
    "/profile/:profileId/metrics",
    async ({ params, query, ctx, services }) => {
      const days = query.days ? Number(query.days) : 30;
      return services.storyService.getStoryMetrics(
        ctx!,
        params.profileId,
        Number.isNaN(days) ? 30 : days,
      );
    },
    {
      query: t.Optional(
        t.Object({
          days: t.Optional(t.String()),
        }),
      ),
    },
  );
