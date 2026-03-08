import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

const businessTypeSchema = z.enum(["beauty", "health", "fitness", "professional", "technical"]);
const kpiQuerySchema = z.object({
  businessType: businessTypeSchema.optional(),
  months: z.coerce.number().default(12).min(1).max(24),
});

export const businessKPIRoutes = new Elysia({ prefix: "/business-kpi" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .get("/dashboard", async ({ query, ctx, services }) => {
    const { businessType, months } = kpiQuerySchema.parse(query);
    
    // Get profile to find business type if not provided
    let actualBusinessType = businessType;
    if (!actualBusinessType && ctx?.user?.id) {
      // Try to get profile's business type
      const profile = await services.profileRepository.findByUserId(ctx.user.id);
      if (profile?.businessTypeId) {
        const businessTypeRecord = await services.profileRepository.getBusinessType(profile.businessTypeId);
        actualBusinessType = businessTypeRecord?.key;
      }
    }
    
    const kpis = await services.businessKPIService.getBusinessKPIs(ctx!, {
      profileId: ctx!.profileId!,
      businessType: actualBusinessType,
    });
    
    return kpis;
  })
  .get("/trends", async ({ query, ctx, services }) => {
    const { months } = kpiQuerySchema.parse(query);
    
    const trends = await services.businessKPIService.getMonthlyTrends(
      ctx!.profileId!,
      months
    );
    
    return trends;
  });
