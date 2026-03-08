import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { BillingPeriod } from "../../db/schema/membership";

export const packageRoutes = new Elysia({ prefix: "/packages" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "global" }, () => {
    return {};
  })

  // ========================================
  // SERVICE PACKAGES
  // ========================================

  // Get all packages for a profile
  .get(
    "/",
    async ({ query, services }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        throw new Error("profileId es requerido");
      }
      
      const packages = await services.servicePackageService.getActivePackagesByProfile(profileId);
      return packages;
    },
    {
      query: t.Object({
        profileId: t.String(),
      }),
    }
  )

  // Get single package
  .get(
    "/:id",
    async ({ params, services }) => {
      const pkg = await services.servicePackageService.getPackageById(params.id);
      if (!pkg) {
        throw new Error("Paquete no encontrado");
      }
      return pkg;
    }
  )

  // Create package
  .post(
    "/",
    async ({ body, set, services }) => {
      const newPackage = await services.servicePackageService.createPackage({
        profileId: body.profileId,
        name: body.name,
        description: body.description,
        price: body.price,
        totalSessions: body.totalSessions,
        discountPercent: body.discountPercent,
        services: body.services,
        validityDays: body.validityDays,
      });
      set.status = 201;
      return newPackage;
    },
    {
      body: t.Object({
        profileId: t.String(),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.String({ minLength: 1 }),
        totalSessions: t.Number({ minimum: 1 }),
        discountPercent: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        services: t.Optional(t.Array(t.String())),
        validityDays: t.Optional(t.Number({ minimum: 1 })),
      }),
    }
  )

  // Update package
  .put(
    "/:id",
    async ({ params, body, services }) => {
      const updated = await services.servicePackageService.updatePackage(params.id, body);
      if (!updated) {
        throw new Error("Paquete no encontrado");
      }
      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        price: t.Optional(t.String({ minLength: 1 })),
        totalSessions: t.Optional(t.Number({ minimum: 1 })),
        discountPercent: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        services: t.Optional(t.Array(t.String())),
        validityDays: t.Optional(t.Number({ minimum: 1 })),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete package
  .delete(
    "/:id",
    async ({ params, set, services }) => {
      await services.servicePackageService.deletePackage(params.id);
      set.status = 204;
    }
  )

  // ========================================
  // MEMBERSHIPS
  // ========================================

  // Get all memberships for a profile
  .get(
    "/memberships",
    async ({ query, services }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        throw new Error("profileId es requerido");
      }
      
      const memberships = await services.membershipService.getActiveMembershipsByProfile(profileId);
      return memberships;
    },
    {
      query: t.Object({
        profileId: t.String(),
      }),
    }
  )

  // Get single membership
  .get(
    "/memberships/:id",
    async ({ params, services }) => {
      const membership = await services.membershipService.getMembershipById(params.id);
      if (!membership) {
        throw new Error("Membresía no encontrada");
      }
      return membership;
    }
  )

  // Create membership
  .post(
    "/memberships",
    async ({ body, set, services }) => {
      const newMembership = await services.membershipService.createMembership({
        profileId: body.profileId,
        name: body.name,
        description: body.description,
        price: body.price,
        billingPeriod: body.billingPeriod as BillingPeriod,
        benefits: body.benefits,
        includedSessions: body.includedSessions,
        discountPercent: body.discountPercent,
        unlimitedSessions: body.unlimitedSessions,
      });
      set.status = 201;
      return newMembership;
    },
    {
      body: t.Object({
        profileId: t.String(),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.String({ minLength: 1 }),
        billingPeriod: t.Union([
          t.Literal("weekly"),
          t.Literal("biweekly"),
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
        benefits: t.Optional(t.Array(t.String())),
        includedSessions: t.Optional(t.Number({ minimum: 0 })),
        discountPercent: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        unlimitedSessions: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update membership
  .put(
    "/memberships/:id",
    async ({ params, body, services }) => {
      const updateData = {
        ...body,
        billingPeriod: body.billingPeriod ? body.billingPeriod as BillingPeriod : undefined,
      };
      const updated = await services.membershipService.updateMembership(params.id, updateData);
      if (!updated) {
        throw new Error("Membresía no encontrada");
      }
      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        price: t.Optional(t.String({ minLength: 1 })),
        billingPeriod: t.Optional(t.Union([
          t.Literal("weekly"),
          t.Literal("biweekly"),
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ])),
        benefits: t.Optional(t.Array(t.String())),
        includedSessions: t.Optional(t.Number({ minimum: 0 })),
        discountPercent: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        unlimitedSessions: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete membership
  .delete(
    "/memberships/:id",
    async ({ params, set, services }) => {
      await services.membershipService.deleteMembership(params.id);
      set.status = 204;
    }
  )

  // ========================================
  // CLIENT PACKAGES (PURCHASES)
  // ========================================

  // Get client packages
  .get(
    "/client-packages",
    async ({ query, services }) => {
      const clientId = query.clientId as string;
      const profileId = query.profileId as string;
      
      if (clientId) {
        return services.clientPackageService.getActiveClientPackages(clientId);
      }
      
      if (profileId) {
        return services.clientPackageService.getClientPackagesByProfile(profileId);
      }
      
      throw new Error("clientId o profileId es requerido");
    },
    {
      query: t.Object({
        clientId: t.Optional(t.String()),
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Get single client package
  .get(
    "/client-packages/:id",
    async ({ params, services }) => {
      const clientPackage = await services.clientPackageService.getClientPackageById(params.id);
      if (!clientPackage) {
        throw new Error("Paquete del cliente no encontrado");
      }
      return clientPackage;
    }
  )

  // Purchase a package
  .post(
    "/client-packages/purchase",
    async ({ body, set, services }) => {
      const purchased = await services.clientPackageService.purchasePackage({
        profileId: body.profileId,
        clientId: body.clientId,
        packageId: body.packageId,
        pricePaid: body.pricePaid,
      });
      set.status = 201;
      return purchased;
    },
    {
      body: t.Object({
        profileId: t.String(),
        clientId: t.String(),
        packageId: t.String(),
        pricePaid: t.String(),
      }),
    }
  )

  // Purchase a membership
  .post(
    "/client-packages/subscribe",
    async ({ body, set, services }) => {
      const subscribed = await services.clientPackageService.purchaseMembership({
        profileId: body.profileId,
        clientId: body.clientId,
        membershipId: body.membershipId,
        pricePaid: body.pricePaid,
        autoRenew: body.autoRenew,
      });
      set.status = 201;
      return subscribed;
    },
    {
      body: t.Object({
        profileId: t.String(),
        clientId: t.String(),
        membershipId: t.String(),
        pricePaid: t.String(),
        autoRenew: t.Optional(t.Boolean()),
      }),
    }
  )

  // Redeem a session
  .post(
    "/client-packages/:id/redeem",
    async ({ params, body, services }) => {
      const updated = await services.clientPackageService.redeemSession(params.id);
      if (!updated) {
        throw new Error("No se pudo canjear la sesión");
      }
      return updated;
    },
    {
      body: t.Object({}),
    }
  )

  // Cancel a package/membership
  .post(
    "/client-packages/:id/cancel",
    async ({ params, services }) => {
      const cancelled = await services.clientPackageService.cancelPackage(params.id);
      if (!cancelled) {
        throw new Error("No se pudo cancelar el paquete");
      }
      return cancelled;
    }
  )

  // Get package details (includes package/membership info)
  .get(
    "/client-packages/:id/details",
    async ({ params, services }) => {
      const details = await services.clientPackageService.getPackageDetails(params.id);
      if (!details) {
        throw new Error("Paquete del cliente no encontrado");
      }
      return details;
    }
  );
