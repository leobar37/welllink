import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { ProfileService } from "../../services/business/profile";
import { SocialLinkService } from "../../services/business/social-link";
import { ProfileRepository } from "../../services/repository/profile";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { AssetRepository } from "../../services/repository/asset";
import { AnalyticsRepository } from "../../services/repository/analytics";

const createProfileSchema = z.object({
  username: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarId: z.string().optional(),
  coverImageId: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  title: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarId: z.string().optional(),
  coverImageId: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export const profileRoutes = new Elysia({ prefix: "/profiles" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "global" }, () => {
    // Initialize repositories and services with DI
    const profileRepository = new ProfileRepository();
    const socialLinkRepository = new SocialLinkRepository();
    const assetRepository = new AssetRepository();
    const analyticsRepository = new AnalyticsRepository();

    const profileService = new ProfileService(
      profileRepository,
      assetRepository,
      analyticsRepository,
    );

    const socialLinkService = new SocialLinkService(
      socialLinkRepository,
      analyticsRepository,
    );

    return {
      profileService,
      socialLinkService,
    };
  })
  .get("/", async ({ ctx, profileService }) => {
    return profileService.getProfiles(ctx!);
  })
  .post("/", async ({ body, set, ctx, profileService }) => {
    const data = createProfileSchema.parse(body);
    const profile = await profileService.createProfile(ctx!, data);
    set.status = 201;
    return profile;
  })
  .get("/:id", async ({ params, ctx, profileService }) => {
    return profileService.getProfile(ctx!, params.id);
  })
  .get("/username/:username", async ({ params, ctx, profileService }) => {
    const profile = await profileService.getProfileByUsername(
      ctx!,
      params.username,
    );
    return profile;
  })
  .put("/:id", async ({ params, body, ctx, profileService }) => {
    const data = updateProfileSchema.parse(body);
    return profileService.updateProfile(ctx!, params.id, data);
  })
  .delete("/:id", async ({ params, ctx, profileService, set }) => {
    await profileService.deleteProfile(ctx!, params.id);
    set.status = 204;
  })
  .get("/:id/stats", async ({ params, ctx, profileService }) => {
    return profileService.getProfileStats(ctx!, params.id);
  });
