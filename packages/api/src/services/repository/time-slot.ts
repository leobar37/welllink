import { db } from "../../db";
import { timeSlot, SlotStatus } from "../../db/schema/time-slot";
import { eq, and, between, gte, lte, desc, sql } from "drizzle-orm";
import type { TimeSlot, NewTimeSlot } from "../../db/schema/time-slot";

export class TimeSlotRepository {
  async create(data: NewTimeSlot): Promise<TimeSlot> {
    const [slot] = await db
      .insert(timeSlot)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    if (!slot) {
      throw new Error("Failed to create time slot");
    }

    return slot;
  }

  async findById(id: string): Promise<TimeSlot | null> {
    const [slot] = await db.select().from(timeSlot).where(eq(timeSlot.id, id));

    return slot || null;
  }

  async findByProfileIdAndDate(
    profileId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.profileId, profileId),
          between(timeSlot.startTime, startOfDay, endOfDay),
        ),
      )
      .orderBy(timeSlot.startTime);
  }

  async findByDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSlot[]> {
    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.profileId, profileId),
          between(timeSlot.startTime, startDate, endDate),
        ),
      )
      .orderBy(timeSlot.startTime);
  }

  async findAvailableSlots(
    profileId: string,
    serviceId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.profileId, profileId),
          eq(timeSlot.serviceId, serviceId),
          eq(timeSlot.status, "available"),
          gte(timeSlot.startTime, date),
        ),
      )
      .orderBy(timeSlot.startTime);
  }

  async updateStatus(id: string, status: SlotStatus): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        status,
        expiresAt:
          status === "pending_approval"
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  async incrementReservations(id: string): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`${timeSlot.currentReservations} + 1`,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  async decrementReservations(id: string): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`GREATEST(${timeSlot.currentReservations} - 1, 0)`,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  async findExpiredPendingSlots(): Promise<TimeSlot[]> {
    const now = new Date();
    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.status, "pending_approval"),
          lte(timeSlot.expiresAt, now),
        ),
      );
  }

  async bulkCreate(slots: NewTimeSlot[]): Promise<TimeSlot[]> {
    const createdSlots = await db.insert(timeSlot).values(slots).returning();

    return createdSlots;
  }

  async delete(id: string): Promise<void> {
    await db.delete(timeSlot).where(eq(timeSlot.id, id));
  }
}
