import type { RequestContext } from "../../types/context";
import { StaffRepository } from "../repository/staff";
import { StaffServiceRepository } from "../repository/staff-service";
import { StaffAvailabilityRepository } from "../repository/staff-availability";
import { ProfileRepository } from "../repository/profile";
import type { Staff, NewStaff } from "../../db/schema/staff";
import type { StaffRole } from "../../db/schema/enums";

/**
 * Input types for staff operations
 */
export interface CreateStaffInput {
  name: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  avatarId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  avatarId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AssignServiceInput {
  serviceId: string;
  isActive?: boolean;
}

export interface SetAvailabilityInput {
  dayOfWeek: number; // 1-7 (ISO-8601)
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  breaks?: { start: string; end: string }[];
  isAvailable?: boolean;
}

export interface StaffWithRelations extends Staff {
  services?: Array<{
    id: string;
    serviceId: string;
    isActive: boolean;
    service: {
      id: string;
      name: string;
      duration: number;
    };
  }>;
  availabilities?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breaks: { start: string; end: string }[];
    isAvailable: boolean;
  }>;
}

/**
 * Staff Business Service
 * Handles staff management business logic including CRUD operations,
 * service assignments, and availability scheduling
 */
export class StaffService {
  constructor(
    private staffRepository: StaffRepository,
    private staffServiceRepo: StaffServiceRepository,
    private staffAvailabilityRepo: StaffAvailabilityRepository,
    private profileRepository: ProfileRepository
  ) {}

  /**
   * Get the target profile ID from query param or user's default profile
   */
  private async getTargetProfileId(
    ctx: RequestContext,
    profileId?: string
  ): Promise<string> {
    if (profileId) {
      // Verify user owns this profile
      const profiles = await this.profileRepository.findByUser(ctx, ctx.userId);
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) {
        throw new Error("Perfil no encontrado o no autorizado");
      }
      return profile.id;
    }

    // Get user's default profile
    const profiles = await this.profileRepository.findByUser(ctx, ctx.userId);
    if (profiles.length === 0) {
      throw new Error("No se encontró ningún perfil");
    }

    return profiles[0].id;
  }

  /**
   * Create a new staff member
   */
  async createStaff(
    ctx: RequestContext,
    profileId: string | undefined,
    data: CreateStaffInput
  ): Promise<Staff> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Check for duplicate email if provided
    if (data.email) {
      const existingByEmail = await this.staffRepository.findByEmail(
        targetProfileId,
        data.email
      );
      if (existingByEmail) {
        throw new Error("Ya existe un miembro del personal con este correo electrónico");
      }
    }

    // Check for duplicate phone if provided
    if (data.phone) {
      const existingByPhone = await this.staffRepository.findByPhone(
        targetProfileId,
        data.phone
      );
      if (existingByPhone) {
        throw new Error("Ya existe un miembro del personal con este teléfono");
      }
    }

    return this.staffRepository.create({
      profileId: targetProfileId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role ?? "staff",
      avatarId: data.avatarId,
      isActive: true,
      metadata: data.metadata ?? {},
    });
  }

  /**
   * Get all staff members for a profile
   */
  async getStaffByProfile(
    ctx: RequestContext,
    profileId?: string
  ): Promise<Staff[]> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);
    return this.staffRepository.findByProfileId(targetProfileId);
  }

  /**
   * Get all active staff members for a profile
   */
  async getActiveStaffByProfile(
    ctx: RequestContext,
    profileId?: string
  ): Promise<Staff[]> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);
    return this.staffRepository.findActiveByProfileId(targetProfileId);
  }

  /**
   * Get a single staff member by ID
   */
  async getStaffById(
    ctx: RequestContext,
    staffId: string,
    profileId?: string
  ): Promise<Staff | null> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);
    const result = await this.staffRepository.findByIdAndProfile(staffId, targetProfileId);
    return result ?? null;
  }

  /**
   * Get staff member with related services and availability
   */
  async getStaffWithRelations(
    ctx: RequestContext,
    staffId: string,
    profileId?: string
  ): Promise<StaffWithRelations | null> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );

    if (!staff) {
      return null;
    }

    // Get services
    const staffServices = await this.staffServiceRepo.findActiveByStaffId(staffId);

    // Get availabilities
    const availabilities = await this.staffAvailabilityRepo.findActiveByStaffId(staffId);

    return {
      ...staff,
      services: staffServices.map((ss) => ({
        id: ss.id,
        serviceId: ss.serviceId,
        isActive: ss.isActive,
        service: (ss as unknown as { service: { id: string; name: string; duration: number } }).service,
      })),
      availabilities: availabilities.map((a) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        breaks: a.breaks ?? [],
        isAvailable: a.isAvailable,
      })),
    };
  }

  /**
   * Update a staff member
   */
  async updateStaff(
    ctx: RequestContext,
    staffId: string,
    profileId: string | undefined,
    data: UpdateStaffInput
  ): Promise<Staff> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const existing = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!existing) {
      throw new Error("Miembro del personal no encontrado");
    }

    // Check for duplicate email if being changed
    if (data.email && data.email !== existing.email) {
      const existingByEmail = await this.staffRepository.findByEmail(
        targetProfileId,
        data.email
      );
      if (existingByEmail) {
        throw new Error("Ya existe un miembro del personal con este correo electrónico");
      }
    }

    // Check for duplicate phone if being changed
    if (data.phone && data.phone !== existing.phone) {
      const existingByPhone = await this.staffRepository.findByPhone(
        targetProfileId,
        data.phone
      );
      if (existingByPhone) {
        throw new Error("Ya existe un miembro del personal con este teléfono");
      }
    }

    return this.staffRepository.updateByProfile(staffId, targetProfileId, data);
  }

  /**
   * Delete (soft delete) a staff member
   */
  async deleteStaff(
    ctx: RequestContext,
    staffId: string,
    profileId?: string
  ): Promise<Staff> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const existing = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!existing) {
      throw new Error("Miembro del personal no encontrado");
    }

    return this.staffRepository.updateByProfile(staffId, targetProfileId, {
      isActive: false,
    });
  }

  /**
   * Assign a service to a staff member
   */
  async assignService(
    ctx: RequestContext,
    staffId: string,
    serviceId: string,
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    // Check if already assigned
    const existing = await this.staffServiceRepo.findByStaffAndService(
      staffId,
      serviceId
    );

    if (existing) {
      // Update existing association
      await this.staffServiceRepo.update(existing.id, { isActive: true });
    } else {
      // Create new association
      await this.staffServiceRepo.create({
        staffId,
        serviceId,
        isActive: true,
      });
    }
  }

  /**
   * Remove a service assignment from a staff member
   */
  async removeService(
    ctx: RequestContext,
    staffId: string,
    serviceId: string,
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    const association = await this.staffServiceRepo.findByStaffAndService(
      staffId,
      serviceId
    );

    if (association) {
      // Soft delete - set isActive to false
      await this.staffServiceRepo.update(association.id, { isActive: false });
    }
  }

  /**
   * Get services assigned to a staff member
   */
  async getStaffServices(
    ctx: RequestContext,
    staffId: string,
    profileId?: string
  ): Promise<Array<{ id: string; serviceId: string; isActive: boolean }>> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    return this.staffServiceRepo.findByStaffId(staffId);
  }

  /**
   * Replace all service assignments for a staff member
   */
  async replaceStaffServices(
    ctx: RequestContext,
    staffId: string,
    serviceIds: string[],
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    await this.staffServiceRepo.replaceForStaff(staffId, serviceIds);
  }

  /**
   * Set availability for a staff member
   */
  async setAvailability(
    ctx: RequestContext,
    staffId: string,
    availability: SetAvailabilityInput,
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    // Validate day of week
    if (availability.dayOfWeek < 1 || availability.dayOfWeek > 7) {
      throw new Error("El día de la semana debe estar entre 1 y 7");
    }

    await this.staffAvailabilityRepo.upsertByStaffAndDay(
      staffId,
      availability.dayOfWeek,
      {
        startTime: availability.startTime,
        endTime: availability.endTime,
        breaks: availability.breaks,
        isAvailable: availability.isAvailable,
      }
    );
  }

  /**
   * Set multiple availabilities for a staff member
   */
  async setAvailabilities(
    ctx: RequestContext,
    staffId: string,
    availabilities: SetAvailabilityInput[],
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    // Validate all days
    for (const a of availabilities) {
      if (a.dayOfWeek < 1 || a.dayOfWeek > 7) {
        throw new Error("El día de la semana debe estar entre 1 y 7");
      }
    }

    const availabilityData = availabilities.map((a) => ({
      staffId,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      breaks: a.breaks ?? [],
      isAvailable: a.isAvailable ?? true,
    }));

    await this.staffAvailabilityRepo.replaceForStaff(staffId, availabilityData);
  }

  /**
   * Get availability for a staff member
   */
  async getAvailability(
    ctx: RequestContext,
    staffId: string,
    profileId?: string
  ): Promise<Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breaks: { start: string; end: string }[];
    isAvailable: boolean;
  }>> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    const availabilities = await this.staffAvailabilityRepo.findByStaffId(staffId);
    return availabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      breaks: a.breaks ?? [],
      isAvailable: a.isAvailable,
    }));
  }

  /**
   * Delete availability for a staff member
   */
  async deleteAvailability(
    ctx: RequestContext,
    staffId: string,
    availabilityId: string,
    profileId?: string
  ): Promise<void> {
    const targetProfileId = await this.getTargetProfileId(ctx, profileId);

    // Verify staff exists
    const staff = await this.staffRepository.findByIdAndProfile(
      staffId,
      targetProfileId
    );
    if (!staff) {
      throw new Error("Miembro del personal no encontrado");
    }

    // Verify availability belongs to this staff
    const availability = await this.staffAvailabilityRepo.findById(availabilityId);
    if (!availability || availability.staffId !== staffId) {
      throw new Error("Disponibilidad no encontrada");
    }

    await this.staffAvailabilityRepo.delete(availabilityId);
  }
}
