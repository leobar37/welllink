import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { ServiceBusinessService } from "../../services/business/service";
import { ServiceRepository } from "../../services/repository/service";
import { AssetRepository } from "../../services/repository/asset";

export const serviceRoutes = new Elysia({ prefix: "/services" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "global" }, () => {
    const serviceRepository = new ServiceRepository();
    const assetRepository = new AssetRepository();

    const serviceBusinessService = new ServiceBusinessService(
      serviceRepository,
      assetRepository,
    );

    return {
      serviceBusinessService,
    };
  })
  .get(
    "/",
    async ({ ctx, query, serviceBusinessService }) => {
      const profileId = query.profileId as string;

      if (!profileId) {
        throw new Error("profileId is required");
      }

      return await serviceBusinessService.getServicesByProfile(
        profileId,
      );
    },
    {
      query: t.Object({
        profileId: t.String(),
        active: t.Optional(t.BooleanString()),
      }),
    },
  )
  .get("/:id", async ({ params, serviceBusinessService }) => {
    return await serviceBusinessService.getServiceById(params.id);
  })
  .post(
    "/",
    async ({ body, set, serviceBusinessService }) => {
      const newService = await serviceBusinessService.createService(
        body.profileId,
        body,
      );
      set.status = 201;
      return newService;
    },
    {
      body: t.Object({
        profileId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        duration: t.Number(),
        price: t.Optional(t.String()),
        category: t.Optional(t.String()),
        requirements: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        imageAssetId: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, serviceBusinessService }) => {
      return await serviceBusinessService.updateService(params.id, body);
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        duration: t.Optional(t.Number()),
        price: t.Optional(t.String()),
        category: t.Optional(t.String()),
        requirements: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        imageAssetId: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async ({ params, set, serviceBusinessService }) => {
    await serviceBusinessService.deleteService(params.id);
    set.status = 204;
  })
  .patch(
    "/:id/image",
    async ({ params, body, serviceBusinessService }) => {
      return await serviceBusinessService.updateServiceImage(
        params.id,
        body.imageAssetId,
      );
    },
    {
      body: t.Object({
        imageAssetId: t.String(),
      }),
    },
  );
