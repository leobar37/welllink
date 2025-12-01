import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

export const socialLinkRoutes = new Elysia({ prefix: "/social-links" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .get(
    "/",
    async ({ query, services, ctx }) => {
      const { profileId } = query;
      if (!profileId) {
        throw new Error("profileId is required");
      }
      return services.socialLinkService.getSocialLinks(ctx!, profileId);
    },
    {
      query: t.Object({
        profileId: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ body, services, ctx, set }) => {
      const link = await services.socialLinkService.createSocialLink(
        ctx!,
        body,
      );
      set.status = 201;
      return link;
    },
    {
      body: t.Object({
        profileId: t.String(),
        platform: t.Union([
          t.Literal("whatsapp"),
          t.Literal("instagram"),
          t.Literal("tiktok"),
          t.Literal("facebook"),
          t.Literal("youtube"),
        ]),
        url: t.String(),
        displayOrder: t.Optional(t.Number()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, services, ctx }) => {
      return services.socialLinkService.updateSocialLink(
        ctx!,
        params.id,
        body,
      );
    },
    {
      body: t.Object({
        platform: t.Optional(
          t.Union([
            t.Literal("whatsapp"),
            t.Literal("instagram"),
            t.Literal("tiktok"),
            t.Literal("facebook"),
            t.Literal("youtube"),
          ]),
        ),
        url: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
      }),
    },
  )
  .delete("/:id", async ({ params, services, ctx, set }) => {
    await services.socialLinkService.deleteSocialLink(ctx!, params.id);
    set.status = 204;
  })
  .post(
    "/reorder",
    async ({ body, services, ctx }) => {
      return services.socialLinkService.reorderSocialLinks(
        ctx!,
        body.profileId,
        body.linkIds,
      );
    },
    {
      body: t.Object({
        profileId: t.String(),
        linkIds: t.Array(t.String()),
      }),
    },
  );
