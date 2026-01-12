import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ReservationRequestRepository } from "../repository/reservation-request";
import { TimeSlotRepository } from "../repository/time-slot";
import { ReservationRepository } from "../repository/reservation";
import type { NewReservation } from "../../db/schema/reservation";
import { sendMedicalEvent } from "../../lib/inngest-client";

export interface ApproveRequestData {
  requestId: string;
  approvedBy: string;
  notes?: string;
  changes?: {
    serviceId?: string;
    timeSlotId?: string;
    price?: number;
  };
}

export interface RejectRequestData {
  requestId: string;
  rejectedBy: string;
  rejectionReason: string;
}

export class ApprovalService {
  constructor(
    private reservationRequestRepository: ReservationRequestRepository,
    private timeSlotRepository: TimeSlotRepository,
    private reservationRepository: ReservationRepository,
  ) {}

  async approveRequest(data: ApproveRequestData) {
    const { requestId, approvedBy, notes, changes } = data;

    // Get the request
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    if (request.status !== "pending") {
      throw new BadRequestException(
        `Request is ${request.status}, cannot be approved`,
      );
    }

    // Check if request has expired
    if (request.expiresAt < new Date()) {
      throw new BadRequestException("Request has expired");
    }

    // Get the slot
    const slot = await this.timeSlotRepository.findById(request.slotId);
    if (!slot) {
      throw new NotFoundException("Time slot not found");
    }

    // If changes are provided, validate them
    let finalSlotId = request.slotId;
    let finalServiceId = request.serviceId;
    let finalPrice: number | undefined;

    if (changes) {
      if (changes.timeSlotId && changes.timeSlotId !== request.slotId) {
        const newSlot = await this.timeSlotRepository.findById(
          changes.timeSlotId,
        );
        if (!newSlot || newSlot.status !== "available") {
          throw new BadRequestException("New time slot is not available");
        }
        // Release old slot
        await this.timeSlotRepository.updateStatus(request.slotId, "available");
        finalSlotId = changes.timeSlotId;
      }

      if (changes.serviceId) {
        finalServiceId = changes.serviceId;
      }

      if (changes.price) {
        finalPrice = changes.price;
      }
    }

    // Create reservation
    const reservationData: NewReservation = {
      profileId: request.profileId,
      slotId: finalSlotId,
      serviceId: finalServiceId,
      requestId: request.id,
      patientName: request.patientName,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      status: "confirmed",
      source: "whatsapp",
      notes: notes || "",
      reminder24hSent: false,
      reminder2hSent: false,
      reminder24hScheduled: false,
      reminder2hScheduled: false,
      noShow: false,
      paymentStatus: "pending",
    };

    const reservation =
      await this.reservationRepository.create(reservationData);

    // Update request status
    const updatedRequest = await this.reservationRequestRepository.updateStatus(
      requestId,
      "approved",
      approvedBy,
    );

    // Update slot status to reserved
    await this.timeSlotRepository.updateStatus(finalSlotId, "reserved");
    await this.timeSlotRepository.incrementReservations(finalSlotId);

    const changesData = changes
      ? {
          originalTime: slot.startTime.toISOString(),
          newTime:
            changes.timeSlotId && changes.timeSlotId !== request.slotId
              ? newSlot?.startTime.toISOString()
              : undefined,
          originalService: request.serviceId,
          newService: changes.serviceId || undefined,
          notes: notes || undefined,
          priceAdjustment: changes.price || undefined,
          durationChange: undefined,
        }
      : {};

    await sendMedicalEvent("reservation/approved", {
      reservationId: reservation.id,
      profileId: request.profileId,
      requestId: request.id,
      approvedBy,
      approvedAt: new Date().toISOString(),
      ...changesData,
    });

    return {
      request: updatedRequest,
      reservation,
      slot:
        finalSlotId === request.slotId
          ? slot
          : await this.timeSlotRepository.findById(finalSlotId),
      changes,
    };
  }

  async rejectRequest(data: RejectRequestData) {
    const { requestId, rejectedBy, rejectionReason } = data;

    // Get the request
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    if (request.status !== "pending") {
      throw new BadRequestException(
        `Request is ${request.status}, cannot be rejected`,
      );
    }

    // Update request status
    const updatedRequest = await this.reservationRequestRepository.updateStatus(
      requestId,
      "rejected",
      undefined,
      rejectionReason,
    );

    // Update slot status back to available
    await this.timeSlotRepository.updateStatus(request.slotId, "available");

    await sendMedicalEvent("reservation/rejected", {
      requestId: request.id,
      profileId: request.profileId,
      rejectionReason,
      rejectedBy,
      rejectedAt: new Date().toISOString(),
    });

    return {
      request: updatedRequest,
      slot: await this.timeSlotRepository.findById(request.slotId),
    };
  }

  async expireRequest(requestId: string) {
    // Get the request
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    if (request.status !== "pending") {
      return { success: false, message: "Request not pending" };
    }

    // Update request status
    const updatedRequest = await this.reservationRequestRepository.updateStatus(
      requestId,
      "expired",
    );

    // Update slot status back to available
    await this.timeSlotRepository.updateStatus(request.slotId, "available");

    return {
      request: updatedRequest,
      slot: await this.timeSlotRepository.findById(request.slotId),
    };
  }

  async cancelReservation(reservationId: string, cancelledBy: string) {
    // This will be implemented when reservation service is created
    throw new BadRequestException(
      "Reservation cancellation not yet implemented",
    );
  }
}
