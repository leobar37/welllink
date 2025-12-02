import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { ThemeService } from "../../services/business/theme";
import { ProfileCustomizationRepository } from "../../services/repository/profile-customization";
import { ProfileRepository } from "../../services/repository/profile";

export const themeRoutes = new Elysia({ prefix: "/themes" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, () => {
    const profileCustomizationRepository = new ProfileCustomizationRepository();
    const profileRepository = new ProfileRepository();

    const themeService = new ThemeService(
      profileCustomizationRepository,
      profileRepository,
    );

    return {
      themeService,
    };
  })
  // Public endpoint - list all available themes
  .get("/", async ({ themeService }) => {
    return themeService.getAvailableThemes();
  })
  // Public endpoint - get a specific theme by ID
  .get("/:themeId", async ({ params, themeService }) => {
    return themeService.getTheme(params.themeId);
  })
  // Protected endpoints for profile theme management
  .use(authGuard)
  .get("/profiles/:profileId", async ({ params, ctx, themeService }) => {
    return themeService.getProfileTheme(ctx!, params.profileId);
  })
  .put(
    "/profiles/:profileId",
    async ({ params, body, ctx, themeService }) => {
      return themeService.updateProfileTheme(ctx!, params.profileId, body.themeId);
    },
    {
      body: t.Object({
        themeId: t.String({ minLength: 1, maxLength: 50 }),
      }),
    },
  );
