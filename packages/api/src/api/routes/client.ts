import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

export const clientRoutes = new Elysia({ prefix: "/clients" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)

  // List all clients
  .get("/", async ({ ctx, services }) => {
    return services.clientService.getClients(ctx!);
  })

  // Get single client
  .get("/:id", async ({ params, ctx, services }) => {
    return services.clientService.getClient(ctx!, params.id);
  })

  // Create client manually
  .post(
    "/",
    async ({ body, set, ctx, services }) => {
      const client = await services.clientService.createClient(ctx!, body);
      set.status = 201;
      return client;
    },
    {
      body: t.Object({
        profileId: t.String(),
        name: t.String(),
        phone: t.String(),
        email: t.Optional(t.String()),
        label: t
          .Union([
            t.Literal("consumidor"),
            t.Literal("prospecto"),
            t.Literal("afiliado"),
          ])
          .optional(),
        notes: t.Optional(t.String()),
      }),
    },
  )

  // Update client
  .put(
    "/:id",
    async ({ params, body, ctx, services }) => {
      const updateData: any = { ...body };
      if (updateData.lastContactAt) {
        updateData.lastContactAt = new Date(updateData.lastContactAt);
      }
      return services.clientService.updateClient(ctx!, params.id, updateData);
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        label: t
          .Union([
            t.Literal("consumidor"),
            t.Literal("prospecto"),
            t.Literal("afiliado"),
          ])
          .optional(),
        notes: t.Optional(t.String()),
        lastContactAt: t.Optional(t.String()),
      }),
    },
  )

  // Delete client
  .delete("/:id", async ({ params, ctx, services, set }) => {
    await services.clientService.deleteClient(ctx!, params.id);
    set.status = 204;
  })

  // Get clients by label
  .get(
    "/label/:label",
    async ({ params, ctx, services }) => {
      return services.clientService.getClientsByLabel(
        ctx!,
        params.label as any,
      );
    },
    {
      params: t.Object({
        label: t.Union([
          t.Literal("consumidor"),
          t.Literal("prospecto"),
          t.Literal("afiliado"),
        ]),
      }),
    },
  )

  // Get clients without recent contact
  .get("/without-contact/:days", async ({ params, ctx, services }) => {
    return services.clientService.getClientsWithoutContact(ctx!, Number(params.days));
  })

  // Get client notes
  .get("/:id/notes", async ({ params, ctx, services }) => {
    return services.clientService.getNotes(ctx!, params.id);
  })

  // Add client note
  .post(
    "/:id/notes",
    async ({ params, body, set, ctx, services }) => {
      const note = await services.clientService.addNote(ctx!, params.id, body.note);
      set.status = 201;
      return note;
    },
    {
      body: t.Object({
        note: t.String(),
      }),
    },
  );
