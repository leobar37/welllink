import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { staffAvailability, type StaffAvailability, type NewStaffAvailability } from "../../db/schema/staff-availability";

export class StaffAvailabilityRepository {
  /**
   * Create a new availability entry
   */
  async create(data: NewStaffAvailability) {
    const [result] = await db.insert(staffAvailability).values(data).returning();
    return result;
  }

  /**
   * Get all availability entries for a staff member
   */
  async findByStaffId(staffId: string) {
    return db.query.staffAvailability.findMany({
      where: eq(staffAvailability.staffId, staffId),
    });
  }

  /**
   * Get active availability entries for a staff member
   */
  async findActiveByStaffId(staffId: string) {
    return db.query.staffAvailability.findMany({
      where: and(
        eq(staffAvailability.staffId, staffId),
        eq(staffAvailability.isAvailable, true)
      ),
    });
  }

  /**
   * Get availability for a specific day of the week
   */
  async findByStaffAndDay(staffId: string, dayOfWeek: number) {
    return db.query.staffAvailability.findFirst({
      where: and(
        eq(staffAvailability.staffId, staffId),
        eq(staffAvailability.dayOfWeek, dayOfWeek)
      ),
    });
  }

  /**
   * Get a single availability entry by ID
   */
  async findById(id: string) {
    return db.query.staffAvailability.findFirst({
      where: eq(staffAvailability.id, id),
    });
  }

  /**
   * Update an availability entry
   */
  async update(id: string, data: Partial<NewStaffAvailability>) {
    const [result] = await db
      .update(staffAvailability)
      .set(data)
      .where(eq(staffAvailability.id, id))
      .returning();
    return result;
  }

  /**
   * Delete an availability entry
   */
  async delete(id: string) {
    const [result] = await db
      .delete(staffAvailability)
      .where(eq(staffAvailability.id, id))
      .returning();
    return result;
  }

  /**
   * Delete all availability entries for a staff member
   */
  async deleteByStaffId(staffId: string) {
    const result = await db
      .delete(staffAvailability)
      .where(eq(staffAvailability.staffId, staffId));
    return result;
  }

  /**
   * Replace all availability entries for a staff member
   */
  async replaceForStaff(staffId: string, availabilities: NewStaffAvailability[]) {
    // Delete existing availabilities
    await this.deleteByStaffId(staffId);

    if (availabilities.length === 0) {
      return [];
    }

    const result = await db
      .insert(staffAvailability)
      .values(availabilities)
      .returning();
    return result;
  }

  /**
   * Set availability for a specific day (upsert)
   */
  async upsertByStaffAndDay(
    staffId: string,
    dayOfWeek: number,
    data: {
      startTime: string;
      endTime: string;
      breaks?: { start: string; end: string }[];
      isAvailable?: boolean;
    }
  ) {
    const existing = await this.findByStaffAndDay(staffId, dayOfWeek);

    if (existing) {
      return this.update(existing.id, {
        ...data,
        breaks: data.breaks,
        isAvailable: data.isAvailable ?? existing.isAvailable,
      });
    }

    return this.create({
      staffId,
      dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      breaks: data.breaks ?? [],
      isAvailable: data.isAvailable ?? true,
    });
  }
}
