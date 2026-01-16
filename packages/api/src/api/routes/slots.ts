import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { SlotService } from "../../services/business/slot";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { MedicalServiceRepository } from "../../services/repository/medical-service";

export const slotsRoutes = new Elysia({ prefix: "/slots" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, () => {
    const timeSlotRepository = new TimeSlotRepository();
    const medicalServiceRepository = new MedicalServiceRepository();

    const slotService = new SlotService(
      timeSlotRepository,
      medicalServiceRepository,
    );

    return {
      slotService,
    };
  })
  .get(
    "/:profileId",
    async ({ params, query, slotService }) => {
      return await slotService.getSlots({
        profileId: params.profileId,
        serviceId: query.serviceId,
        status: query.status as any,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });
    },
    {
      query: t.Object({
        serviceId: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("available"),
            t.Literal("pending_approval"),
            t.Literal("reserved"),
            t.Literal("expired"),
            t.Literal("blocked"),
          ]),
        ),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ body, set, slotService }) => {
      const result = await slotService.createSlot({
        ...body,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
      });
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.String(),
        serviceId: t.String(),
        startTime: t.String(),
        endTime: t.String(),
        maxReservations: t.Optional(t.Integer({ minimum: 1 })),
      }),
    },
  )
  .post(
    "/batch",
    async ({ body, set, slotService }) => {
      const result = await slotService.createBatchSlots({
        profileId: body.profileId,
        serviceId: body.serviceId,
        slots: body.slots.map(slot => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        })),
      });
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.String(),
        serviceId: t.String(),
        slots: t.Array(
          t.Object({
            startTime: t.String(),
            endTime: t.String(),
            maxReservations: t.Optional(t.Integer({ minimum: 1 })),
          }),
        ),
      }),
    },
  )
  .put(
    "/:id/status",
    async ({ params, body, slotService }) => {
      return await slotService.updateSlotStatus({
        slotId: params.id,
        status: body.status,
      });
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal("available"),
          t.Literal("pending_approval"),
          t.Literal("reserved"),
          t.Literal("expired"),
          t.Literal("blocked"),
          t.Literal("cancelled"),
        ]),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, slotService }) => {
      return await slotService.deleteSlot(params.id);
    },
  )
  .post(
    "/:id/block",
    async ({ params, slotService }) => {
      return await slotService.blockSlot(params.id);
    },
  )
  .post(
    "/:id/unblock",
    async ({ params, slotService }) => {
      return await slotService.unblockSlot(params.id);
    },
  )
  .get(
    "/:profileId/available/:serviceId",
    async ({ params, query, slotService }) => {
      const date = query.date ? new Date(query.date) : new Date();
      return await slotService.getAvailableSlots(
        params.profileId,
        params.serviceId,
        date,
      );
    },
    {
      query: t.Object({
        date: t.Optional(t.String()),
      }),
    },
  );
