import { NotFoundException, BadRequestException } from "../../utils/http-exceptions";
import { TimeSlotRepository } from "../repository/time-slot";
import { MedicalServiceRepository } from "../repository/medical-service";
import type { NewTimeSlot, SlotStatus } from "../../db/schema/time-slot";

export interface CreateSlotData {
  profileId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  maxReservations?: number;
}

export interface CreateBatchSlotsData {
  profileId: string;
  serviceId: string;
  slots: Array<{
    startTime: Date;
    endTime: Date;
    maxReservations?: number;
  }>;
}

export interface UpdateSlotStatusData {
  slotId: string;
  status: SlotStatus;
}

export interface GetSlotsData {
  profileId: string;
  serviceId?: string;
  status?: SlotStatus;
  startDate?: Date;
  endDate?: Date;
}

export class SlotService {
  constructor(
    private timeSlotRepository: TimeSlotRepository,
    private medicalServiceRepository: MedicalServiceRepository,
  ) {}

  async createSlot(data: CreateSlotData) {
    const { profileId, serviceId, startTime, endTime, maxReservations } = data;

    // Validate service exists and belongs to profile
    const service = await this.medicalServiceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Medical service not found");
    }

    if (service.profileId !== profileId) {
      throw new BadRequestException("Service does not belong to this profile");
    }

    // Validate time range
    if (endTime <= startTime) {
      throw new BadRequestException("endTime must be after startTime");
    }

    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (duration < 15) {
      throw new BadRequestException("Slot duration must be at least 15 minutes");
    }

    // Check for overlapping slots
    const existingSlots =
      await this.timeSlotRepository.findByProfileIdAndDate(
        profileId,
        startTime,
      );

    for (const slot of existingSlots) {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);

      // Check for overlap
      if (
        (startTime >= slotStart && startTime < slotEnd) ||
        (endTime > slotStart && endTime <= slotEnd) ||
        (startTime <= slotStart && endTime >= slotEnd)
      ) {
        throw new BadRequestException(
          "This time range overlaps with an existing slot",
        );
      }
    }

    // Create the slot
    const slotData: NewTimeSlot = {
      profileId,
      serviceId,
      startTime,
      endTime,
      maxReservations: maxReservations || 1,
      currentReservations: 0,
      status: "available",
    };

    const slot = await this.timeSlotRepository.create(slotData);

    return slot;
  }

  async createBatchSlots(data: CreateBatchSlotsData) {
    const { profileId, serviceId, slots } = data;

    // Validate service exists and belongs to profile
    const service = await this.medicalServiceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Medical service not found");
    }

    if (service.profileId !== profileId) {
      throw new BadRequestException("Service does not belong to this profile");
    }

    // Get existing slots to check for overlaps
    const dates = slots.map((s) => s.startTime);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const existingSlots = await this.timeSlotRepository.findByProfileIdAndDate(
      profileId,
      minDate,
    );

    const slotsToCreate: NewTimeSlot[] = [];
    const errors: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < slots.length; i++) { const slotData = slots[i];
      const { startTime, endTime, maxReservations } = slotData;

      // Validate time range
      if (endTime <= startTime) {
        errors.push({
          index: i,
          reason: "endTime must be after startTime",
        });
        continue;
      }

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (duration < 15) {
        errors.push({
          index: i,
          reason: "Slot duration must be at least 15 minutes",
        });
        continue;
      }

      // Check for overlaps
      let hasOverlap = false;
      for (const existing of existingSlots) {
        const existingStart = new Date(existing.startTime);
        const existingEnd = new Date(existing.endTime);

        if (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        ) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) {
        errors.push({
          index: i,
          reason: "Time range overlaps with existing slot",
        });
        continue;
      }

      slotsToCreate.push({
        profileId,
        serviceId,
        startTime,
        endTime,
        maxReservations: maxReservations || 1,
        currentReservations: 0,
        status: "available",
      });
    }

    // Batch create valid slots
    let created: any[] = [];
    if (slotsToCreate.length > 0) {
      created = await this.timeSlotRepository.bulkCreate(slotsToCreate);
    }

    return {
      created: created.length,
      failed: errors.length,
      errors,
      slots: created,
    };
  }

  async updateSlotStatus(data: UpdateSlotStatusData) {
    const { slotId, status } = data;

    // Check if slot exists
    const slot = await this.timeSlotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundException("Time slot not found");
    }

    // Validate status transition
    const validTransitions: Record<SlotStatus, SlotStatus[]> = {
      available: ["pending_approval", "blocked", "expired"],
      pending_approval: ["available", "reserved", "expired"],
      reserved: ["cancelled"],
      expired: ["available"],
      blocked: ["available"],
      cancelled: [],
    };

    if (
      !validTransitions[slot.status].includes(status) &&
      slot.status !== status
    ) {
      throw new BadRequestException(
        `Cannot transition from ${slot.status} to ${status}`,
      );
    }

    const updated = await this.timeSlotRepository.updateStatus(slotId, status);

    return updated;
  }

  async getSlots(data: GetSlotsData) {
    const { profileId, serviceId, status, startDate, endDate } = data;

    // If filtering by date range
    if (startDate && endDate) {
      const slots = [];

      // Get slots for each day in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const daySlots = await this.timeSlotRepository.findByProfileIdAndDate(
          profileId,
          new Date(currentDate),
        );

        // Apply filters
        const filtered = daySlots.filter((slot) => {
          if (serviceId && slot.serviceId !== serviceId) return false;
          if (status && slot.status !== status) return false;
          return true;
        });

        slots.push(...filtered);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return slots;
    }

    // If filtering by service only
    if (serviceId) {
      const slots = await this.timeSlotRepository.findByProfileIdAndDate(
        profileId,
        new Date(),
      );

      return slots.filter((slot) => {
        if (slot.serviceId !== serviceId) return false;
        if (status && slot.status !== status) return false;
        return true;
      });
    }

    // Default: get today's slots
    const today = new Date();
    const slots = await this.timeSlotRepository.findByProfileIdAndDate(
      profileId,
      today,
    );

    return status ? slots.filter((s) => s.status === status) : slots;
  }

  async deleteSlot(slotId: string) {
    const slot = await this.timeSlotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundException("Time slot not found");
    }

    // Cannot delete reserved slots
    if (slot.status === "reserved" || slot.status === "pending_approval") {
      throw new BadRequestException(
        "Cannot delete a slot that is reserved or pending approval",
      );
    }

    await this.timeSlotRepository.delete(slotId);

    return { success: true };
  }

  async blockSlot(slotId: string) {
    return this.updateSlotStatus({ slotId, status: "blocked" });
  }

  async unblockSlot(slotId: string) {
    const slot = await this.timeSlotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundException("Time slot not found");
    }

    if (slot.status !== "blocked") {
      throw new BadRequestException("Slot is not blocked");
    }

    return this.updateSlotStatus({ slotId, status: "available" });
  }

  async getAvailableSlots(
    profileId: string,
    serviceId: string,
    date: Date,
  ) {
    return await this.timeSlotRepository.findAvailableSlots(
      profileId,
      serviceId,
      date,
    );
  }
}
