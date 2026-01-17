import { addDays, startOfDay, endOfDay } from "date-fns";
import { inngest } from "../../lib/inngest-client";
import {
  evolutionService,
  type EventContext,
  type InngestFunctionContext,
} from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { AvailabilityService } from "../../services/business/availability";
import { AvailabilityRuleRepository } from "../../services/repository/availability-rule";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { db } from "../../db";
import { profile } from "../../db/schema";
import { eq } from "drizzle-orm";

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

    const result = await step.run("create-slots", async () => {
      const availabilityRuleRepository = new AvailabilityRuleRepository();
      const timeSlotRepository = new TimeSlotRepository();
      const medicalServiceRepository = new MedicalServiceRepository();

      const availabilityService = new AvailabilityService(
        availabilityRuleRepository,
        timeSlotRepository,
      );

      const targetDate = new Date(event.data.targetDate);
      const activeServices =
        await medicalServiceRepository.findActiveByProfileId(
          event.data.profileId,
        );
      const services =
        event.data.generateForServices.length > 0
          ? event.data.generateForServices
          : activeServices.map((s) => s.id);

      if (services.length === 0) {
        logger.warn(
          `No active services found for profile ${event.data.profileId}`,
        );
        return { count: 0, services: [], date: event.data.targetDate };
      }

      const startDate = startOfDay(targetDate);
      const endDate = endOfDay(targetDate);

      const generatedResult = await availabilityService.generateSlotsForRange(
        event.data.profileId,
        services[0],
        startDate,
        endDate,
      );

      logger.info(
        `Generated ${generatedResult.generated} slots for profile ${event.data.profileId} on ${event.data.targetDate}`,
      );

      return {
        count: generatedResult.generated,
        services,
        date: event.data.targetDate,
      };
    });

    return {
      success: true,
      profileId: event.data.profileId,
      targetDate: event.data.targetDate,
      generatedSlots: result,
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

    const result = await step.run(
      "trigger-generation-for-all-profiles",
      async () => {
        const medicalServiceRepository = new MedicalServiceRepository();

        const allProfiles = await db
          .select()
          .from(profile)
          .where(eq(profile.isPublished, true));

        const tomorrow = addDays(new Date(), 1);
        const targetDate = tomorrow.toISOString().split("T")[0];

        const scheduledEvents: Array<{
          profileId: string;
          services: string[];
          targetDate: string;
        }> = [];

        for (const profileData of allProfiles) {
          const activeServices =
            await medicalServiceRepository.findActiveByProfileId(
              profileData.id,
            );
          const services = activeServices.map((s) => s.id);

          if (services.length === 0) {
            logger.warn(
              `No active services for profile ${profileData.id}, skipping`,
            );
            continue;
          }

          await inngest.send({
            name: "slot/generate-daily",
            data: {
              profileId: profileData.id,
              targetDate,
              timezone: "America/Mexico_City",
              generateForServices: services,
            },
          });

          scheduledEvents.push({
            profileId: profileData.id,
            services,
            targetDate,
          });

          logger.info(
            `Scheduled slot generation for profile ${profileData.id}`,
          );
        }

        return {
          timestamp: new Date().toISOString(),
          status: "triggered",
          profilesProcessed: scheduledEvents.length,
          scheduledEvents,
        };
      },
    );

    return {
      success: true,
      result,
    };
  },
);
