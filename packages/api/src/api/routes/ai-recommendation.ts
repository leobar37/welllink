import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

// health-survey: REMOVED - legacy wellness feature
// ai-recommendation routes simplified to not depend on health surveys

export const aiRecommendationRoutes = new Elysia({
  prefix: "/ai-recommendations",
})
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  // Get all recommendations for a profile
  .get("/", async ({ query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      set.status = 400;
      return { error: "profileId query parameter is required" };
    }
    return services.aiRecommendationService.getRecommendations(profileId);
  })
  // Get latest recommendation for a profile
  .get("/latest", async ({ query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      set.status = 400;
      return { error: "profileId query parameter is required" };
    }
    try {
      return await services.aiRecommendationService.getLatestRecommendation(
        profileId,
      );
    } catch {
      set.status = 404;
      return { error: "No recommendations found" };
    }
  })
  // Get stats
  .get("/stats", async ({ query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      set.status = 400;
      return { error: "profileId query parameter is required" };
    }
    return services.aiRecommendationService.getRecommendationStats(profileId);
  })
  // Get specific recommendation
  .get("/:id", async ({ params, query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      set.status = 400;
      return { error: "profileId query parameter is required" };
    }
    try {
      return await services.aiRecommendationService.getRecommendationByProfile(
        params.id,
        profileId,
      );
    } catch {
      set.status = 404;
      return { error: "Recommendation not found" };
    }
  })
  // Delete recommendation
  .delete("/:id", async ({ params, query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      set.status = 400;
      return { error: "profileId query parameter is required" };
    }
    try {
      await services.aiRecommendationService.deleteRecommendation(
        params.id,
        profileId,
      );
      set.status = 204;
    } catch {
      set.status = 404;
      return { error: "Recommendation not found" };
    }
  });
