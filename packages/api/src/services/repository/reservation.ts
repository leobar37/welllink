import { db } from "../../db";
import {
  reservation as reservationTable,
  ReservationStatus,
  PaymentStatus,
} from "../../db/schema/reservation";
import { eq, and, desc, or, gte, lte } from "drizzle-orm";
import type { Reservation, NewReservation } from "../../db/schema/reservation";

export class ReservationRepository {
  async create(data: NewReservation): Promise<Reservation> {
    const [reservation] = await db
      .insert(reservationTable)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!reservation) {
      throw new Error("Failed to create reservation");
    }

    return reservation;
  }

  async findById(id: string): Promise<Reservation | null> {
    const [reservation] = await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.id, id));

    return reservation || null;
  }

  async findByProfileId(profileId: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.profileId, profileId))
      .orderBy(desc(reservationTable.createdAt));
  }

  async findBySlotId(slotId: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.slotId, slotId))
      .orderBy(desc(reservationTable.createdAt));
  }

  async findByPatientPhone(
    patientPhone: string,
  ): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.patientPhone, patientPhone))
      .orderBy(desc(reservationTable.createdAt));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.status, status))
      .orderBy(desc(reservationTable.createdAt));
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
  ): Promise<Reservation> {
    const [reservation] = await db
      .update(reservationTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(reservationTable.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async markAsCompleted(id: string): Promise<Reservation> {
    const [reservation] = await db
      .update(reservationTable)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservationTable.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async markAsNoShow(id: string): Promise<Reservation> {
    const [reservation] = await db
      .update(reservationTable)
      .set({
        status: "no_show",
        noShow: true,
        updatedAt: new Date(),
      })
      .where(eq(reservationTable.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async cancelReservation(
    id: string,
    cancelledBy: "patient" | "doctor" | "system",
  ): Promise<Reservation> {
    const [reservation] = await db
      .update(reservationTable)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        paymentStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(reservationTable.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async updateReminderFlags(
    id: string,
    flags: {
      reminder24hSent?: boolean;
      reminder2hSent?: boolean;
      reminder24hScheduled?: boolean;
      reminder2hScheduled?: boolean;
    },
  ): Promise<Reservation> {
    const [reservation] = await db
      .update(reservationTable)
      .set({
        ...flags,
        updatedAt: new Date(),
      })
      .where(eq(reservationTable.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  /**
   * Find conflicting reservations for a staff member at a given time
   * Returns reservations that overlap with the given time range
   * Simplified: checks for reservations within a time window
   */
  async findConflictingForStaff(
    staffId: string,
    scheduledAtUtc: Date,
    duration: number = 60, // default duration in minutes
  ): Promise<Reservation[]> {
    // Check within a window around the scheduled time
    const windowStart = new Date(scheduledAtUtc.getTime() - 12 * 60 * 60 * 1000); // 12 hours before
    const windowEnd = new Date(scheduledAtUtc.getTime() + 12 * 60 * 60 * 1000); // 12 hours after

    const reservations = await db
      .select()
      .from(reservationTable)
      .where(
        and(
          eq(reservationTable.staffId, staffId),
          // Only check confirmed reservations (not cancelled, completed, or no_show)
          eq(reservationTable.status, "confirmed"),
          // Check that the existing reservation is on the same day (within 12 hours)
          gte(reservationTable.scheduledAtUtc, windowStart),
          lte(reservationTable.scheduledAtUtc, windowEnd),
        ),
      );

    // Filter to only those that actually overlap with the new appointment
    const appointmentEnd = new Date(scheduledAtUtc.getTime() + duration * 60 * 1000);
    
    return reservations.filter((res) => {
      const resStart = res.scheduledAtUtc;
      // Overlap: resStart < appointmentEnd AND resStart + 30min > scheduledAtUtc
      // Simplified: check if starts are within 30 minutes of each other
      const timeDiff = Math.abs(resStart.getTime() - scheduledAtUtc.getTime());
      const thirtyMinutes = 30 * 60 * 1000;
      
      return timeDiff < thirtyMinutes;
    });
  }
}
