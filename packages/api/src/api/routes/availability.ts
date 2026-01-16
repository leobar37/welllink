import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { AvailabilityService } from "../../services/business/availability";
import { AvailabilityRuleRepository } from "../../services/repository/availability-rule";
import { TimeSlotRepository } from "../../services/repository/time-slot";

export const availabilityRoutes = new Elysia({ prefix: "/availability" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, () => {
    const availabilityRuleRepository = new AvailabilityRuleRepository();
    const timeSlotRepository = new TimeSlotRepository();

    const availabilityService = new AvailabilityService(
      availabilityRuleRepository,
      timeSlotRepository,
    );

    return {
      availabilityService,
    };
  })
  .get("/:profileId", async ({ params }) => {
    const availabilityRuleRepository = new AvailabilityRuleRepository();
    return await availabilityRuleRepository.findByProfileId(params.profileId);
  })
  .post(
    "/",
    async ({ body, set, availabilityService }) => {
      const result = await availabilityService.createRule({
        ...body,
        effectiveFrom: body.effectiveFrom
          ? new Date(body.effectiveFrom)
          : undefined,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
      });
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.String(),
        dayOfWeek: t.Integer({ minimum: 0, maximum: 6 }),
        startTime: t.String({
          pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
        }),
        endTime: t.String({
          pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
        }),
        slotDuration: t.Integer({ minimum: 15 }),
        bufferTime: t.Optional(t.Integer({ minimum: 0 })),
        maxAppointmentsPerSlot: t.Optional(t.Integer({ minimum: 1 })),
        effectiveFrom: t.Optional(t.String()),
        effectiveTo: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, availabilityService }) => {
      return await availabilityService.updateRule(params.id, {
        ...body,
        effectiveFrom: body.effectiveFrom
          ? new Date(body.effectiveFrom)
          : undefined,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
      });
    },
    {
      body: t.Object({
        dayOfWeek: t.Optional(t.Integer({ minimum: 0, maximum: 6 })),
        startTime: t.Optional(
          t.String({
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
          }),
        ),
        endTime: t.Optional(
          t.String({
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
          }),
        ),
        slotDuration: t.Optional(t.Integer({ minimum: 15 })),
        bufferTime: t.Optional(t.Integer({ minimum: 0 })),
        maxAppointmentsPerSlot: t.Optional(t.Integer({ minimum: 1 })),
        effectiveFrom: t.Optional(t.String()),
        effectiveTo: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete("/:id", async ({ params, availabilityService }) => {
    return await availabilityService.deleteRule(params.id);
  })
  .get(
    "/preview/:profileId",
    async ({ params, query }) => {
      const availabilityService = new AvailabilityService(
        new AvailabilityRuleRepository(),
        new TimeSlotRepository(),
      );

      const startDate = query.startDate
        ? new Date(query.startDate)
        : new Date();
      const endDate = query.endDate
        ? new Date(query.endDate)
        : addDays(startDate, 7);

      return await availabilityService.previewSlots({
        profileId: params.profileId,
        startDate,
        endDate,
      });
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/generate",
    async ({ body, set, availabilityService }) => {
      const result = await availabilityService.generateSlotsForRange(
        body.profileId,
        body.serviceId,
        new Date(body.startDate),
        new Date(body.endDate),
      );
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.String(),
        serviceId: t.String(),
        startDate: t.String(),
        endDate: t.String(),
      }),
    },
  );

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
