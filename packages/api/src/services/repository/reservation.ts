import { db } from "../../db";
import {
  reservation as reservationTable,
  ReservationStatus,
  PaymentStatus,
} from "../../db/schema/reservation";
import { eq, and, desc } from "drizzle-orm";
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
}

    return reservation;
  }

  async findById(id: string): Promise<Reservation | null> {
    const [reservation] = await db
      .select()
      .from(reservation)
      .where(eq(reservation.id, id));

    return reservation || null;
  }

  async findByProfileId(profileId: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservation)
      .where(eq(reservation.profileId, profileId))
      .orderBy(desc(reservation.createdAt));
  }

  async findBySlotId(slotId: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservation)
      .where(eq(reservation.slotId, slotId))
      .orderBy(desc(reservation.createdAt));
  }

  async findByPatientPhone(patientPhone: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservation)
      .where(eq(reservation.patientPhone, patientPhone))
      .orderBy(desc(reservation.createdAt));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservation)
      .where(eq(reservation.status, status))
      .orderBy(desc(reservation.createdAt));
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
  ): Promise<Reservation> {
    const [reservation] = await db
      .update(reservation)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(reservation.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async markAsCompleted(id: string): Promise<Reservation> {
    const [reservation] = await db
      .update(reservation)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservation.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }

  async markAsNoShow(id: string): Promise<Reservation> {
    const [reservation] = await db
      .update(reservation)
      .set({
        status: "no_show",
        noShow: true,
        updatedAt: new Date(),
      })
      .where(eq(reservation.id, id))
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
      .update(reservation)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        paymentStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(reservation.id, id))
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
      .update(reservation)
      .set({
        ...flags,
        updatedAt: new Date(),
      })
      .where(eq(reservation.id, id))
      .returning();

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return reservation;
  }
}
