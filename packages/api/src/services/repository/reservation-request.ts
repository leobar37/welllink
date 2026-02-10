import { db } from "../../db";
import {
  reservationRequest,
  RequestStatus,
} from "../../db/schema/reservation-request";
import { eq, and, desc, sql, lte } from "drizzle-orm";
import type {
  ReservationRequest,
  NewReservationRequest,
} from "../../db/schema/reservation-request";

export class ReservationRequestRepository {
  async create(data: NewReservationRequest): Promise<ReservationRequest> {
    const [request] = await db
      .insert(reservationRequest)
      .values({
        ...data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!request) {
      throw new Error("Failed to create reservation request");
    }

    return request;
  }

  async findById(id: string): Promise<ReservationRequest | null> {
    const [request] = await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.id, id));

    return request || null;
  }

  async findPendingByProfileId(
    profileId: string,
  ): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(
        and(
          eq(reservationRequest.profileId, profileId),
          eq(reservationRequest.status, "pending"),
        ),
      )
      .orderBy(desc(reservationRequest.createdAt));
  }

  async findByPatientPhone(
    patientPhone: string,
  ): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.patientPhone, patientPhone))
      .orderBy(desc(reservationRequest.createdAt));
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    approvedBy?: string,
    rejectionReason?: string,
  ): Promise<ReservationRequest> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "approved") {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    } else if (status === "rejected") {
      updateData.rejectionReason = rejectionReason;
    }

    const [request] = await db
      .update(reservationRequest)
      .set(updateData)
      .where(eq(reservationRequest.id, id))
      .returning();

    if (!request) {
      throw new Error("Request not found");
    }

    return request;
  }

  async findExpiredRequests(): Promise<ReservationRequest[]> {
    const now = new Date();
    return await db
      .select()
      .from(reservationRequest)
      .where(
        and(
          eq(reservationRequest.status, "pending"),
          lte(reservationRequest.expiresAt, now),
        ),
      );
  }

  async countPendingByProfileId(profileId: string): Promise<number> {
    const [result] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(reservationRequest)
      .where(
        and(
          eq(reservationRequest.profileId, profileId),
          eq(reservationRequest.status, "pending"),
        ),
      );

    return result?.count || 0;
  }

  async findByStatus(status: RequestStatus): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.status, status))
      .orderBy(desc(reservationRequest.createdAt));
  }

  async updateProposalDetails(
    id: string,
    proposedAtUtc: Date,
    proposalReason: string,
    proposalExpiresAt: Date,
  ): Promise<ReservationRequest> {
    const [request] = await db
      .update(reservationRequest)
      .set({
        proposedAtUtc,
        proposalReason,
        proposalExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(reservationRequest.id, id))
      .returning();

    if (!request) {
      throw new Error("Request not found");
    }

    return request;
  }

  async clearProposal(id: string): Promise<ReservationRequest> {
    const [request] = await db
      .update(reservationRequest)
      .set({
        proposedAtUtc: null,
        proposalReason: null,
        proposalExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(reservationRequest.id, id))
      .returning();

    if (!request) {
      throw new Error("Request not found");
    }

    return request;
  }
}
