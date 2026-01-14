import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { MedicalServiceBusinessService } from "../../services/business/medical-service";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { AssetRepository } from "../../services/repository/asset";

export const medicalServiceRoutes = new Elysia({ prefix: "/medical-services" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "global" }, () => {
    const medicalServiceRepository = new MedicalServiceRepository();
    const assetRepository = new AssetRepository();

    const medicalServiceBusinessService = new MedicalServiceBusinessService(
      medicalServiceRepository,
      assetRepository,
    );

    return {
      medicalServiceBusinessService,
    };
  })
  .get(
    "/",
    async ({ ctx, query, medicalServiceBusinessService }) => {
      const profileId = query.profileId as string;

      if (!profileId) {
        throw new Error("profileId is required");
      }

      return await medicalServiceBusinessService.getServicesByProfile(
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
  .get("/:id", async ({ params, medicalServiceBusinessService }) => {
    return await medicalServiceBusinessService.getServiceById(params.id);
  })
  .post(
    "/",
    async ({ body, set, medicalServiceBusinessService }) => {
      const service = await medicalServiceBusinessService.createService(
        body.profileId,
        body,
      );
      set.status = 201;
      return service;
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
    async ({ params, body, medicalServiceBusinessService }) => {
      return await medicalServiceBusinessService.updateService(params.id, body);
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
  .delete("/:id", async ({ params, set, medicalServiceBusinessService }) => {
    await medicalServiceBusinessService.deleteService(params.id);
    set.status = 204;
  })
  .patch(
    "/:id/image",
    async ({ params, body, medicalServiceBusinessService }) => {
      return await medicalServiceBusinessService.updateServiceImage(
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
