import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import {
  generateRecommendationsStream,
  generateRecommendations,
} from "../../services/ai";
import type { HealthSurveyResponseData } from "../../db/schema/health-survey";

export const aiRecommendationRoutes = new Elysia({ prefix: "/ai-recommendations" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  // Generate recommendations for a survey response (streaming)
  .post(
    "/generate/:surveyResponseId/stream",
    async ({ params, query, services, set }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        set.status = 400;
        return { error: "profileId query parameter is required" };
      }

      // Get the survey response
      const surveyResponse =
        await services.healthSurveyRepository.findOneByProfile(
          params.surveyResponseId,
          profileId
        );

      if (!surveyResponse) {
        set.status = 404;
        return { error: "Survey response not found" };
      }

      const responses = surveyResponse.responses as HealthSurveyResponseData;

      // Generate recommendations with streaming
      // Note: generateRecommendationsStream returns synchronously (not a Promise)
      const result = generateRecommendationsStream({
        visitorName: surveyResponse.visitorName,
        responses,
      });

      // Return the text stream response for streaming to client
      return result.toTextStreamResponse();
    }
  )
  // Generate recommendations for a survey response (non-streaming, saves to DB)
  .post(
    "/generate/:surveyResponseId",
    async ({ params, query, services, set }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        set.status = 400;
        return { error: "profileId query parameter is required" };
      }

      const startTime = Date.now();

      // Get the survey response
      const surveyResponse =
        await services.healthSurveyRepository.findOneByProfile(
          params.surveyResponseId,
          profileId
        );

      if (!surveyResponse) {
        set.status = 404;
        return { error: "Survey response not found" };
      }

      const responses = surveyResponse.responses as HealthSurveyResponseData;

      // Generate recommendations
      const result = await generateRecommendations({
        visitorName: surveyResponse.visitorName,
        responses,
      });

      const processingTimeMs = Date.now() - startTime;

      // Save to database
      const recommendation =
        await services.aiRecommendationService.createRecommendation({
          profileId,
          surveyResponseId: params.surveyResponseId,
          recommendations: result.object.clientRecommendations,
          advisorNotes: result.object.advisorNotes,
          aiModel: "gpt-4o",
          processingTimeMs,
        });

      set.status = 201;
      return recommendation;
    }
  )
  // Save recommendations after streaming (called from frontend onFinish)
  .post(
    "/save/:surveyResponseId",
    async ({ params, query, body, services, set }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        set.status = 400;
        return { error: "profileId query parameter is required" };
      }

      // Check if recommendation already exists for this survey
      const existing = await services.aiRecommendationService.getRecommendationBySurvey(
        params.surveyResponseId
      );

      if (existing) {
        // Update existing
        // For now, delete and recreate (simpler)
        await services.aiRecommendationService.deleteRecommendation(
          existing.id,
          profileId
        );
      }

      // Save new recommendation
      const recommendation = await services.aiRecommendationService.createRecommendation({
        profileId,
        surveyResponseId: params.surveyResponseId,
        recommendations: body.clientRecommendations,
        advisorNotes: body.advisorNotes,
        aiModel: "gpt-4o",
        processingTimeMs: body.processingTimeMs || 0,
      });

      set.status = 201;
      return recommendation;
    },
    {
      body: t.Object({
        clientRecommendations: t.Any(),
        advisorNotes: t.Any(),
        processingTimeMs: t.Optional(t.Number()),
      }),
    }
  )
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
        profileId
      );
    } catch {
      set.status = 404;
      return { error: "No recommendations found" };
    }
  })
  // Get recommendation by survey response ID
  .get("/survey/:surveyResponseId", async ({ params, services, set }) => {
    const recommendation =
      await services.aiRecommendationService.getRecommendationBySurvey(
        params.surveyResponseId
      );
    if (!recommendation) {
      set.status = 404;
      return { error: "No recommendation found for this survey" };
    }
    return recommendation;
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
        profileId
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
        profileId
      );
      set.status = 204;
    } catch {
      set.status = 404;
      return { error: "Recommendation not found" };
    }
  });
