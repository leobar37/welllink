import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { ProfileService } from "../../services/business/profile";
import { SocialLinkService } from "../../services/business/social-link";
import { ProfileRepository } from "../../services/repository/profile";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { AssetRepository } from "../../services/repository/asset";
import { AnalyticsRepository } from "../../services/repository/analytics";

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
  .post(
    "/",
    async ({ body, set, ctx, profileService }) => {
      const profile = await profileService.createProfile(ctx!, body);
      set.status = 201;
      return profile;
    },
    {
      body: t.Object({
        username: t.String({ pattern: "^[a-z0-9-]+$" }),
        displayName: t.String({ minLength: 1 }),
        title: t.Optional(t.String({ minLength: 1 })),
        bio: t.Optional(t.String()),
        avatarId: t.Optional(t.String()),
        coverImageId: t.Optional(t.String()),
        whatsappNumber: t.Optional(t.String()),
      }),
    },
  )
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
  .put(
    "/:id",
    async ({ params, body, ctx, profileService }) => {
      return profileService.updateProfile(ctx!, params.id, body);
    },
    {
      body: t.Object({
        username: t.Optional(t.String({ pattern: "^[a-z0-9-]+$" })),
        displayName: t.Optional(t.String({ minLength: 1 })),
        title: t.Optional(t.String({ minLength: 1 })),
        bio: t.Optional(t.String()),
        avatarId: t.Optional(t.String()),
        coverImageId: t.Optional(t.String()),
        whatsappNumber: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async ({ params, ctx, profileService, set }) => {
    await profileService.deleteProfile(ctx!, params.id);
    set.status = 204;
  })
  .get("/:id/stats", async ({ params, ctx, profileService }) => {
    return profileService.getProfileStats(ctx!, params.id);
  })
  .patch(
    "/:id/features-config",
    async ({ params, body, ctx, profileService }) => {
      return profileService.updateFeaturesConfig(ctx!, params.id, body);
    },
    {
      body: t.Object({
        healthSurvey: t.Optional(
          t.Object({
            enabled: t.Boolean(),
            buttonText: t.String({ maxLength: 100 }),
          }),
        ),
      }),
    },
  );
