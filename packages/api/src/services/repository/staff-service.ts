import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db";
import { staffService, type StaffService, type NewStaffService } from "../../db/schema/staff-service";
import { staff } from "../../db/schema/staff";
import { service } from "../../db/schema/service";

export class StaffServiceRepository {
  /**
   * Create a staff-service association
   */
  async create(data: NewStaffService) {
    const [result] = await db.insert(staffService).values(data).returning();
    return result;
  }

  /**
   * Get all services assigned to a staff member
   */
  async findByStaffId(staffId: string) {
    return db.query.staffService.findMany({
      where: eq(staffService.staffId, staffId),
    });
  }

  /**
   * Get all active services assigned to a staff member
   */
  async findActiveByStaffId(staffId: string) {
    return db.query.staffService.findMany({
      where: and(
        eq(staffService.staffId, staffId),
        eq(staffService.isActive, true)
      ),
      with: {
        service: true,
      },
    });
  }

  /**
   * Get all staff members who can perform a specific service
   */
  async findByServiceId(serviceId: string) {
    return db.query.staffService.findMany({
      where: and(
        eq(staffService.serviceId, serviceId),
        eq(staffService.isActive, true)
      ),
      with: {
        staff: true,
      },
    });
  }

  /**
   * Get a single staff-service association by ID
   */
  async findById(id: string) {
    return db.query.staffService.findFirst({
      where: eq(staffService.id, id),
    });
  }

  /**
   * Get a specific staff-service association
   */
  async findByStaffAndService(staffId: string, serviceId: string) {
    return db.query.staffService.findFirst({
      where: and(
        eq(staffService.staffId, staffId),
        eq(staffService.serviceId, serviceId)
      ),
    });
  }

  /**
   * Update a staff-service association
   */
  async update(id: string, data: Partial<NewStaffService>) {
    const [result] = await db
      .update(staffService)
      .set(data)
      .where(eq(staffService.id, id))
      .returning();
    return result;
  }

  /**
   * Delete a staff-service association
   */
  async delete(id: string) {
    const [result] = await db
      .delete(staffService)
      .where(eq(staffService.id, id))
      .returning();
    return result;
  }

  /**
   * Delete all service associations for a staff member
   */
  async deleteByStaffId(staffId: string) {
    const result = await db
      .delete(staffService)
      .where(eq(staffService.staffId, staffId));
    return result;
  }

  /**
   * Delete all staff associations for a service
   */
  async deleteByServiceId(serviceId: string) {
    const result = await db
      .delete(staffService)
      .where(eq(staffService.serviceId, serviceId));
    return result;
  }

  /**
   * Replace all service associations for a staff member
   */
  async replaceForStaff(staffId: string, serviceIds: string[]) {
    // Delete existing associations
    await this.deleteByStaffId(staffId);

    // Create new associations
    const newAssociations = serviceIds.map((serviceId) => ({
      staffId,
      serviceId,
      isActive: true,
    }));

    if (newAssociations.length === 0) {
      return [];
    }

    const result = await db
      .insert(staffService)
      .values(newAssociations)
      .returning();
    return result;
  }

  /**
   * Check if a staff member is assigned to a service
   */
  async isServiceAssignedToStaff(staffId: string, serviceId: string) {
    const association = await this.findByStaffAndService(staffId, serviceId);
    return association != null && association.isActive;
  }
}
