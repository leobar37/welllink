import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

const createSurveySchema = z.object({
  profileId: z.string().uuid(),
  visitorName: z.string().min(1),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  visitorWhatsapp: z.string().optional(),
  referredBy: z.string().optional(),
  responses: z.record(z.string(), z.unknown()),
});

const updateSurveySchema = z.object({
  visitorName: z.string().min(1).optional(),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  visitorWhatsapp: z.string().optional(),
  referredBy: z.string().optional(),
  responses: z.record(z.string(), z.unknown()).optional(),
});

export const healthSurveyRoutes = new Elysia({ prefix: "/health-survey" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  // Public route - visitors can submit surveys without auth
  .post("/public", async ({ body, set, services }) => {
    const data = createSurveySchema.parse(body);
    const response =
      await services.healthSurveyService.createSurveyResponse(data);
    set.status = 201;
    return response;
  })
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
  .put("/:id", async ({ params, body, query, services }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      return { error: "profileId query parameter is required" };
    }
    const data = updateSurveySchema.parse(body);
    return services.healthSurveyService.updateSurveyResponse(
      params.id,
      profileId,
      data,
    );
  })
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
