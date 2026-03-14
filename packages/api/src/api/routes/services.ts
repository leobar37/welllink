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

      return await serviceBusinessService.getServicesByProfile(profileId);
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
  )
  // ========================================
  // SERVICE-PRODUCT ASSOCIATIONS
  // ========================================

  // Get products for a service
  .get("/:id/products", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;

    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(
        ctx!,
        ctx!.userId,
      );
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }

    return services.serviceProductService.getProductsByService(
      ctx!,
      targetProfileId,
      params.id,
      {
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        offset: query.offset ? parseInt(query.offset as string) : undefined,
        isActive:
          query.isActive === "true"
            ? true
            : query.isActive === "false"
              ? false
              : undefined,
      },
    );
  })

  // Add product to service
  .post(
    "/:id/products",
    async ({ params, body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;

      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(
          ctx!,
          ctx!.userId,
        );
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }

      const serviceProduct =
        await services.serviceProductService.createServiceProduct(
          ctx!,
          targetProfileId,
          {
            serviceId: params.id,
            productId: body.productId,
            quantityRequired: body.quantityRequired,
            isRequired: body.isRequired,
            notes: body.notes,
          },
        );

      set.status = 201;
      return serviceProduct;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        productId: t.String({ minLength: 1 }),
        quantityRequired: t.Optional(t.Number({ minimum: 1 })),
        isRequired: t.Optional(t.Boolean()),
        notes: t.Optional(t.String()),
      }),
    },
  )

  // Replace all products for a service
  .put(
    "/:id/products",
    async ({ params, body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;

      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(
          ctx!,
          ctx!.userId,
        );
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }

      const serviceProducts =
        await services.serviceProductService.replaceProductsForService(
          ctx!,
          targetProfileId,
          params.id,
          body.products,
        );

      set.status = 200;
      return serviceProducts;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        products: t.Array(
          t.Object({
            productId: t.String({ minLength: 1 }),
            quantityRequired: t.Optional(t.Number({ minimum: 1 })),
            isRequired: t.Optional(t.Boolean()),
            notes: t.Optional(t.String()),
          }),
        ),
      }),
    },
  )

  // Get single service-product association
  .get("/products/:id", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;

    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(
        ctx!,
        ctx!.userId,
      );
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }

    const serviceProduct =
      await services.serviceProductService.getServiceProduct(
        ctx!,
        targetProfileId,
        params.id,
      );

    if (!serviceProduct) {
      throw new Error("Asociación de servicio-producto no encontrada");
    }

    return serviceProduct;
  })

  // Update service-product association
  .put(
    "/products/:id",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;

      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(
          ctx!,
          ctx!.userId,
        );
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }

      return services.serviceProductService.updateServiceProduct(
        ctx!,
        targetProfileId,
        params.id,
        body,
      );
    },
    {
      body: t.Object({
        quantityRequired: t.Optional(t.Number({ minimum: 1 })),
        isRequired: t.Optional(t.Boolean()),
        notes: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )

  // Delete service-product association
  .delete("/products/:id", async ({ params, query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;

    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(
        ctx!,
        ctx!.userId,
      );
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }

    await services.serviceProductService.deleteServiceProduct(
      ctx!,
      targetProfileId,
      params.id,
    );
    set.status = 204;
  });
