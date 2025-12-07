import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

const trackViewSchema = z.object({
  profileId: z.string().min(1),
  source: z
    .enum(["qr", "direct_link", "referral"])
    .optional()
    .default("direct_link"),
});

const trackClickSchema = z.object({
  socialLinkId: z.string().min(1),
});

const rangeQuerySchema = z.object({
  days: z.coerce.number().default(30),
});

const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().default(15),
});

export const analyticsRoutes = new Elysia({ prefix: "/analytics" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  // Public routes (no auth required for tracking)
  .post("/track-view", async ({ body, set, services }) => {
    const data = trackViewSchema.parse(body);
    const view = await services.analyticsService.trackProfileView(
      data.profileId,
      data.source,
    );
    set.status = 201;
    return view;
  })
  .post("/track-click", async ({ body, set, services }) => {
    const data = trackClickSchema.parse(body);
    const click = await services.analyticsService.trackSocialClick(
      data.socialLinkId,
    );
    set.status = 201;
    return click;
  })
  // Protected routes (require auth)
  .use(authGuard)
  .get("/profiles/:profileId/views", async ({ params, ctx, services }) => {
    return services.analyticsService.getProfileViews(ctx!, params.profileId);
  })
  .get(
    "/profiles/:profileId/views/stats",
    async ({ params, query, ctx, services }) => {
      const { days } = rangeQuerySchema.parse(query);
      return services.analyticsService.getProfileViewStats(
        ctx!,
        params.profileId,
        days,
      );
    },
  )
  .get("/profiles/:profileId/clicks", async ({ params, ctx, services }) => {
    return services.analyticsService.getSocialClickStats(
      ctx!,
      params.profileId,
    );
  })
  .get(
    "/profiles/:profileId/clicks/stats",
    async ({ params, query, ctx, services }) => {
      const { days } = rangeQuerySchema.parse(query);
      return services.analyticsService.getSocialClickStats(
        ctx!,
        params.profileId,
        days,
      );
    },
  )
  .get(
    "/profiles/:profileId/overall",
    async ({ params, query, ctx, services }) => {
      const { days } = rangeQuerySchema.parse(query);
      return services.analyticsService.getOverallStats(
        ctx!,
        params.profileId,
        days,
      );
    },
  )
  .get(
    "/profiles/:profileId/trending",
    async ({ params, query, ctx, services }) => {
      const { days } = rangeQuerySchema.parse(query);
      return services.analyticsService.getTrendingStats(
        ctx!,
        params.profileId,
        days,
      );
    },
  )
  .get(
    "/profiles/:profileId/qr-stats",
    async ({ params, query, ctx, services }) => {
      const { days } = rangeQuerySchema.parse(query);
      return services.analyticsService.getQRStats(ctx!, params.profileId, days);
    },
  )
  .get(
    "/profiles/:profileId/recent-activity",
    async ({ params, query, ctx, services }) => {
      const { limit } = recentActivityQuerySchema.parse(query);
      return services.analyticsService.getRecentActivity(
        ctx!,
        params.profileId,
        limit,
      );
    },
  );
