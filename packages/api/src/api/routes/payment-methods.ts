import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

// Reusable type for payment method type (simpler than Union)
const paymentMethodType = t.String({ minLength: 1, maxLength: 50 });

export const paymentMethodRoutes = new Elysia({ prefix: "/payment-methods" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .get(
    "/",
    async ({ query, services }) => {
      const { profileId, activeOnly } = query;

      if (!profileId) {
        return { error: "profileId is required" };
      }

      if (activeOnly === "true") {
        return services.paymentMethodService.getActivePaymentMethods(profileId);
      }

      return services.paymentMethodService.getPaymentMethods(profileId);
    },
    {
      query: t.Object({
        profileId: t.String(),
        activeOnly: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ body, services, set }) => {
      const method = await services.paymentMethodService.createPaymentMethod(
        body.profileId,
        body,
      );
      set.status = 201;
      return method;
    },
    {
      body: t.Object({
        profileId: t.String(),
        name: t.String({ minLength: 1, maxLength: 100 }),
        type: paymentMethodType,
        instructions: t.Optional(t.String()),
        details: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
        displayOrder: t.Optional(t.Number()),
        metadata: t.Optional(t.Any()),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, services }) => {
      return services.paymentMethodService.getPaymentMethodById(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, services }) => {
      return services.paymentMethodService.updatePaymentMethod(params.id, body);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        type: t.Optional(paymentMethodType),
        instructions: t.Optional(t.String()),
        details: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
        displayOrder: t.Optional(t.Number()),
        metadata: t.Optional(t.Any()),
      }),
    },
  )
  .delete("/:id", async ({ params, services, set }) => {
    const deleted = await services.paymentMethodService.deletePaymentMethod(
      params.id,
    );
    set.status = 200;
    return deleted;
  })
  .post(
    "/:id/toggle",
    async ({ params, body, services }) => {
      return services.paymentMethodService.togglePaymentMethod(
        params.id,
        body.isActive,
      );
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        isActive: t.Boolean(),
      }),
    },
  )
  .post(
    "/activate",
    async ({ body, services }) => {
      return services.paymentMethodService.activatePaymentMethods(
        body.profileId,
        body.methodIds,
      );
    },
    {
      body: t.Object({
        profileId: t.String(),
        methodIds: t.Array(t.String()),
      }),
    },
  )
  .post(
    "/reorder",
    async ({ body, services }) => {
      return services.paymentMethodService.reorderPaymentMethods(
        body.profileId,
        body.methodIds,
      );
    },
    {
      body: t.Object({
        profileId: t.String(),
        methodIds: t.Array(t.String()),
      }),
    },
  )
  .post(
    "/seed-defaults/:profileId",
    async ({ params, services }) => {
      return services.paymentMethodService.seedDefaultMethods(params.profileId);
    },
    {
      params: t.Object({
        profileId: t.String(),
      }),
    },
  );
