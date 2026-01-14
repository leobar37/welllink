import { inngest } from "../../lib/inngest-client";
import {
  evolutionService,
  type EventContext,
  type InngestFunctionContext,
} from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";

export const generateDailySlots = inngest.createFunction(
  {
    id: "generate-daily-slots",
    name: "Generate Daily Time Slots",
  },
  { event: "slot/generate-daily" },
  async ({ event, step, logger }: EventContext<"slot/generate-daily">) => {
    logger.info(
      `Generating slots for doctor ${event.data.profileId} on ${event.data.targetDate}`,
    );

    const generatedSlots = await step.run("create-slots", async () => {
      return {
        count: 0,
        profileId: event.data.profileId,
        targetDate: event.data.targetDate,
      };
    });

    return {
      success: true,
      generatedSlots,
    };
  },
);

export const dailySlotGenerationForAll = inngest.createFunction(
  {
    id: "daily-slot-generation-all",
    name: "Daily Slot Generation for All Doctors",
  },
  { cron: "0 0 * * *" },
  async ({ step, logger }: InngestFunctionContext) => {
    logger.info("Starting daily slot generation for all doctors");

    const result = await step.run("trigger-generation", async () => {
      return {
        timestamp: new Date().toISOString(),
        status: "triggered",
      };
    });

    return {
      success: true,
      result,
    };
  },
);
