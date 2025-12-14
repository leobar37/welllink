import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

export const healthSurveyRoutes = new Elysia({ prefix: "/health-survey" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  // Public route - visitors can submit surveys without auth
  .post(
    "/public",
    async ({ body, set, services }) => {
      const response =
        await services.healthSurveyService.createSurveyResponse(body);
      set.status = 201;
      return response;
    },
    {
      body: t.Object({
        profileId: t.String(),
        visitorName: t.String({ minLength: 1 }),
        visitorPhone: t.Optional(t.String()),
        visitorEmail: t.Optional(t.String()),
        visitorWhatsapp: t.Optional(t.String()),
        referredBy: t.Optional(t.String()),
        responses: t.Record(t.String(), t.Unknown()),
      }),
    },
  )
  // Protected routes
  .use(authGuard)
  .get("/", async ({ query, services }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }
    return services.healthSurveyService.getSurveyResponses(profileId);
  })
  .get("/latest", async ({ query, services }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }
    return services.healthSurveyService.getLatestResponse(profileId);
  })
  .get("/stats", async ({ query, services }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }
    return services.healthSurveyService.getSurveyStats(profileId);
  })
  .get("/:id", async ({ params, services }) => {
    return services.healthSurveyService.getSurveyResponse(params.id);
  })

  // Create client from survey (Method 1 - explicit action)
  .post(
    "/:id/create-client",
    async ({ params, query, set, ctx, services }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        set.status = 400;
        return { error: "profileId query parameter is required" };
      }

      // Get survey response
      const survey = await services.healthSurveyService.getSurveyResponse(
        params.id,
      );

      // Create client from survey using ClientService
      const client = await services.clientService.createClientFromSurvey(
        ctx!,
        survey,
        profileId,
      );

      set.status = 201;
      return client;
    },
  )

  // Bulk create clients from multiple surveys
  .post(
    "/bulk-create-clients",
    async ({ body, query, set, ctx, services }) => {
      const { surveyIds } = body;

      const profileId = query.profileId as string;
      if (!profileId) {
        set.status = 400;
        return { error: "profileId query parameter is required" };
      }

      const results = await Promise.allSettled(
        surveyIds.map(async (surveyId: string) => {
          const survey = await services.healthSurveyService.getSurveyResponse(
            surveyId,
          );
          return services.clientService.createClientFromSurvey(ctx!, survey, profileId);
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      set.status = 207; // Multi-Status
      return {
        successful,
        failed,
        total: surveyIds.length,
      };
    },
    {
      body: t.Object({
        surveyIds: t.Array(t.String()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, query, services }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        return { error: "profileId query parameter is required" };
      }
      return services.healthSurveyService.updateSurveyResponse(
        params.id,
        profileId,
        body,
      );
    },
    {
      body: t.Object({
        visitorName: t.Optional(t.String({ minLength: 1 })),
        visitorPhone: t.Optional(t.String()),
        visitorEmail: t.Optional(t.String()),
        visitorWhatsapp: t.Optional(t.String()),
        referredBy: t.Optional(t.String()),
        responses: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    },
  )
  .delete("/:id", async ({ params, query, services, set }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }
    await services.healthSurveyService.deleteSurveyResponse(
      params.id,
      profileId,
    );
    set.status = 204;
  })
  .get("/range/:startDate/:endDate", async ({ params, query, services }) => {
    const { startDate, endDate } = params;
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return services.healthSurveyService.getResponsesByDateRange(
      profileId,
      start,
      end,
    );
  });
