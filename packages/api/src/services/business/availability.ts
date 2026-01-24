import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "../../utils/http-exceptions";
import { AvailabilityRuleRepository } from "../repository/availability-rule";
import { TimeSlotRepository } from "../repository/time-slot";
import type { NewAvailabilityRule } from "../../db/schema/availability-rule";
import type { NewTimeSlot } from "../../db/schema/time-slot";
import { addDays, setHours, setMinutes, differenceInMinutes } from "date-fns";

export interface CreateAvailabilityRuleData {
  profileId: string;
  dayOfWeek: number;
  startTime: string; // "09:00" format
  endTime: string; // "17:00" format
  slotDuration: number;
  bufferTime?: number;
  maxAppointmentsPerSlot?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdateAvailabilityRuleData {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  bufferTime?: number;
  maxAppointmentsPerSlot?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export interface PreviewSlotsData {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export class AvailabilityService {
  constructor(
    private availabilityRuleRepository: AvailabilityRuleRepository,
    private timeSlotRepository: TimeSlotRepository,
  ) {}

  async createRule(data: CreateAvailabilityRuleData) {
    // Validate day of week
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new BadRequestException(
        "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
      );
    }

    // Validate times
    const startMinutes = this.timeToMinutes(data.startTime);
    const endMinutes = this.timeToMinutes(data.endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException("startTime must be before endTime");
    }

    // Validate slot duration
    if (data.slotDuration < 15) {
      throw new BadRequestException("slotDuration must be at least 15 minutes");
    }

    // Check that duration fits in the time range
    const totalMinutes = endMinutes - startMinutes;
    if (data.slotDuration > totalMinutes) {
      throw new BadRequestException(
        `slotDuration (${data.slotDuration}min) is greater than available time (${totalMinutes}min)`,
      );
    }

    // Check for overlapping rules on the same day
    const existingRules = await this.availabilityRuleRepository.findByDayOfWeek(
      data.profileId,
      data.dayOfWeek,
    );

    for (const rule of existingRules) {
      const ruleStart = this.timeToMinutes(rule.startTime);
      const ruleEnd = this.timeToMinutes(rule.endTime);

      // Check for overlap
      if (
        (startMinutes >= ruleStart && startMinutes < ruleEnd) ||
        (endMinutes > ruleStart && endMinutes <= ruleEnd) ||
        (startMinutes <= ruleStart && endMinutes >= ruleEnd)
      ) {
        throw new ConflictException(
          "This time range overlaps with an existing rule for this day",
        );
      }
    }

    // Create the rule
    const ruleData: NewAvailabilityRule = {
      profileId: data.profileId,
      dayOfWeek: data.dayOfWeek,
      startTime: `${data.startTime}:00`,
      endTime: `${data.endTime}:00`,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime || 0,
      maxAppointmentsPerSlot: data.maxAppointmentsPerSlot || 1,
      effectiveFrom: data.effectiveFrom || new Date(),
      effectiveTo: data.effectiveTo,
    };

    const rule = await this.availabilityRuleRepository.create(ruleData);

    return rule;
  }

  async updateRule(ruleId: string, data: UpdateAvailabilityRuleData) {
    // Check if rule exists
    const existingRule = await this.availabilityRuleRepository.findById(ruleId);
    if (!existingRule) {
      throw new NotFoundException("Availability rule not found");
    }

    // Validate day of week if provided
    if (
      data.dayOfWeek !== undefined &&
      (data.dayOfWeek < 0 || data.dayOfWeek > 6)
    ) {
      throw new BadRequestException(
        "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
      );
    }

    // Validate times if provided
    let startMinutes: number | undefined;
    let endMinutes: number | undefined;

    if (data.startTime && data.endTime) {
      startMinutes = this.timeToMinutes(data.startTime);
      endMinutes = this.timeToMinutes(data.endTime);

      if (startMinutes >= endMinutes) {
        throw new BadRequestException("startTime must be before endTime");
      }
    } else if (data.startTime) {
      startMinutes = this.timeToMinutes(data.startTime);
      const existingEndMinutes = this.timeToMinutes(existingRule.endTime);
      if (startMinutes >= existingEndMinutes) {
        throw new BadRequestException("startTime must be before endTime");
      }
    } else if (data.endTime) {
      const existingStartMinutes = this.timeToMinutes(existingRule.startTime);
      endMinutes = this.timeToMinutes(data.endTime);
      if (existingStartMinutes >= endMinutes) {
        throw new BadRequestException("startTime must be before endTime");
      }
    }

    // Validate slot duration if provided
    if (data.slotDuration !== undefined) {
      if (data.slotDuration < 15) {
        throw new BadRequestException(
          "slotDuration must be at least 15 minutes",
        );
      }

      // Check that duration fits in the time range
      const checkStart =
        startMinutes ?? this.timeToMinutes(existingRule.startTime);
      const checkEnd = endMinutes ?? this.timeToMinutes(existingRule.endTime);
      const totalMinutes = checkEnd - checkStart;

      if (data.slotDuration > totalMinutes) {
        throw new BadRequestException(
          `slotDuration (${data.slotDuration}min) is greater than available time (${totalMinutes}min)`,
        );
      }
    }

    // Check for overlapping rules if day or times changed
    const newDayOfWeek = data.dayOfWeek ?? existingRule.dayOfWeek;
    const checkStartTime = data.startTime || existingRule.startTime;
    const checkEndTime = data.endTime || existingRule.endTime;

    const otherRules = await this.availabilityRuleRepository.findByDayOfWeek(
      existingRule.profileId,
      newDayOfWeek,
    );

    for (const rule of otherRules) {
      if (rule.id === ruleId) continue; // Skip the rule being updated

      const ruleStart = this.timeToMinutes(rule.startTime);
      const ruleEnd = this.timeToMinutes(rule.endTime);
      const updateStart = this.timeToMinutes(checkStartTime);
      const updateEnd = this.timeToMinutes(checkEndTime);

      // Check for overlap
      if (
        (updateStart >= ruleStart && updateStart < ruleEnd) ||
        (updateEnd > ruleStart && updateEnd <= ruleEnd) ||
        (updateStart <= ruleStart && updateEnd >= ruleEnd)
      ) {
        throw new ConflictException(
          "This time range overlaps with an existing rule for this day",
        );
      }
    }

    // Update the rule
    const updated = await this.availabilityRuleRepository.update(ruleId, data);

    return updated;
  }

  async deleteRule(ruleId: string) {
    const rule = await this.availabilityRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException("Availability rule not found");
    }

    await this.availabilityRuleRepository.delete(ruleId);

    return { success: true };
  }

  async deactivateRule(ruleId: string) {
    const rule = await this.availabilityRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException("Availability rule not found");
    }

    const deactivated =
      await this.availabilityRuleRepository.deactivate(ruleId);

    return deactivated;
  }

  async previewSlots(data: PreviewSlotsData) {
    const { profileId, startDate, endDate } = data;

    // Get all active rules for this profile
    const rules =
      await this.availabilityRuleRepository.findByProfileId(profileId);
    const activeRules = rules.filter((r) => r.isActive);

    const generatedSlots: {
      date: Date;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      count: number;
    }[] = [];

    // Generate slots for each day in the range
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Find rules for this day
      const dayRules = activeRules.filter((r) => r.dayOfWeek === dayOfWeek);

      for (const rule of dayRules) {
        // Check if date is within effective range
        const ruleStart = new Date(rule.effectiveFrom);
        ruleStart.setHours(0, 0, 0, 0);

        const ruleEnd = rule.effectiveTo
          ? new Date(rule.effectiveTo)
          : new Date("2099-12-31");
        ruleEnd.setHours(23, 59, 59, 999);

        const checkDate = new Date(currentDate);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate < ruleStart || checkDate > ruleEnd) {
          continue;
        }

        // Calculate number of slots
        const startMinutes = this.timeToMinutes(rule.startTime);
        const endMinutes = this.timeToMinutes(rule.endTime);
        const totalMinutes = endMinutes - startMinutes;
        const slotCount = Math.floor(totalMinutes / rule.slotDuration);

        generatedSlots.push({
          date: new Date(currentDate),
          dayOfWeek,
          startTime: rule.startTime.substring(0, 5),
          endTime: rule.endTime.substring(0, 5),
          count: slotCount,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return generatedSlots;
  }

  async generateSlotsForDate(
    profileId: string,
    serviceId: string,
    targetDate: Date,
  ) {
    // Get active rules for this date
    const rules =
      await this.availabilityRuleRepository.findByProfileId(profileId);
    const activeRules = rules.filter((r) => r.isActive);
    const dayOfWeek = targetDate.getDay();
    const dayRules = activeRules.filter((r) => r.dayOfWeek === dayOfWeek);

    if (dayRules.length === 0) {
      return { generated: 0, slots: [] };
    }

    const slotsToCreate: NewTimeSlot[] = [];

    for (const rule of dayRules) {
      // Check if date is within effective range
      const ruleStart = new Date(rule.effectiveFrom);
      ruleStart.setHours(0, 0, 0, 0);

      const ruleEnd = rule.effectiveTo
        ? new Date(rule.effectiveTo)
        : new Date("2099-12-31");
      ruleEnd.setHours(23, 59, 59, 999);

      const checkDate = new Date(targetDate);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < ruleStart || checkDate > ruleEnd) {
        continue;
      }

      const startMinutes = this.timeToMinutes(rule.startTime);
      const endMinutes = this.timeToMinutes(rule.endTime);
      const slotDuration = rule.slotDuration;
      const bufferTime = rule.bufferTime || 0;

      let currentMinutes = startMinutes;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStart = new Date(targetDate);
        const [startHour, startMinute] = this.minutesToTime(currentMinutes);

        // Fix for Timezone (UTC-5 Lima)
        // We want the slot to be at the correct local time (e.g. 09:00 Lima)
        // Since we store as UTC, 09:00 Lima = 14:00 UTC (09 + 5)
        const LIMA_OFFSET_HOURS = 5;
        slotStart.setUTCHours(startHour + LIMA_OFFSET_HOURS, startMinute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        const slotData: NewTimeSlot = {
          profileId,
          serviceId,
          startTime: slotStart,
          endTime: slotEnd,
          maxReservations: rule.maxAppointmentsPerSlot || 1,
          currentReservations: 0,
          status: "available",
        };

        slotsToCreate.push(slotData);

        currentMinutes += slotDuration + bufferTime;
      }
    }

    // Batch create slots
    if (slotsToCreate.length > 0) {
      const created = await this.timeSlotRepository.bulkCreate(slotsToCreate);
      return {
        generated: created.length,
        slots: created,
      };
    }

    return { generated: 0, slots: [] };
  }

  async generateSlotsForRange(
    profileId: string,
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const allGeneratedSlots: any[] = [];
    let totalGenerated = 0;

    while (currentDate <= end) {
      const result = await this.generateSlotsForDate(
        profileId,
        serviceId,
        new Date(currentDate),
      );

      totalGenerated += result.generated;
      allGeneratedSlots.push(...result.slots);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      generated: totalGenerated,
      slots: allGeneratedSlots,
    };
  }

  private timeToMinutes(time: string | Date): number {
    if (typeof time === "string") {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    } else {
      return time.getHours() * 60 + time.getMinutes();
    }
  }

  private minutesToTime(minutes: number): [number, number] {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return [hours, mins];
  }
}
