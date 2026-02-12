import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ReservationRequestRepository } from "../repository/reservation-request";
import { ReservationRepository } from "../repository/reservation";
import { ProfileRepository } from "../repository/profile";
import type { NewReservation } from "../../db/schema/reservation";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export interface ApproveRequestData {
  requestId: string;
  approvedBy: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  notes?: string;
}

export interface RejectRequestData {
  requestId: string;
  rejectedBy: string;
  rejectionReason: string;
}

export interface ProposeRescheduleData {
  requestId: string;
  proposedBy: string;
  newDate: string;
  newTime: string;
  timezone: string;
  reason?: string;
}

export interface RespondRescheduleData {
  requestId: string;
  decision: "accept" | "reject";
}

export class ApprovalService {
  constructor(
    private reservationRequestRepository: ReservationRequestRepository,
    private reservationRepository: ReservationRepository,
    private profileRepository: ProfileRepository,
  ) {}

  async approveRequest(data: ApproveRequestData) {
    const {
      requestId,
      approvedBy,
      scheduledDate,
      scheduledTime,
      timezone,
      notes,
    } = data;

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

    // Convert scheduled date/time to UTC
    const localDateTime = parse(
      `${scheduledDate}T${scheduledTime}:00`,
      "yyyy-MM-dd'T'HH:mm:ss",
      new Date(),
    );
    const scheduledAtUtc = fromZonedTime(localDateTime, timezone);

    // Create reservation
    const reservationData: NewReservation = {
      profileId: request.profileId,
      serviceId: request.serviceId,
      requestId: request.id,
      patientName: request.patientName,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      status: "confirmed",
      source: "whatsapp",
      notes: notes || "",
      scheduledAtUtc,
      scheduledTimezone: timezone,
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

    return {
      request: updatedRequest,
      reservation,
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

    return {
      request: updatedRequest,
    };
  }

  async proposeReschedule(data: ProposeRescheduleData) {
    const { requestId, proposedBy, newDate, newTime, timezone, reason } = data;

    // Get the request
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    if (request.status !== "pending") {
      throw new BadRequestException(
        `Request is ${request.status}, cannot propose reschedule`,
      );
    }

    // Convert proposed date/time to UTC
    const localDateTime = parse(
      `${newDate}T${newTime}:00`,
      "yyyy-MM-dd'T'HH:mm:ss",
      new Date(),
    );
    const proposedAtUtc = fromZonedTime(localDateTime, timezone);

    // Calculate expiration (e.g., 24 hours from now)
    const proposalExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update request with proposal
    const updatedRequest = await this.reservationRequestRepository.updateStatus(
      requestId,
      "counter_proposed",
      undefined,
      undefined,
    );

    // Additional fields for proposal
    await this.reservationRequestRepository.updateProposalDetails(
      requestId,
      proposedAtUtc,
      reason || "",
      proposalExpiresAt,
    );

    return {
      request: updatedRequest,
      proposedAtUtc,
      proposalExpiresAt,
    };
  }

  async respondToReschedule(data: RespondRescheduleData) {
    const { requestId, decision } = data;

    // Get the request
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    if (request.status !== "counter_proposed") {
      throw new BadRequestException(
        `Request is ${request.status}, cannot respond to reschedule`,
      );
    }

    if (decision === "accept") {
      // Accept the proposal - create reservation with proposed time
      if (!request.proposedAtUtc) {
        throw new BadRequestException("No reschedule proposal found");
      }

      const reservationData: NewReservation = {
        profileId: request.profileId,
        serviceId: request.serviceId,
        requestId: request.id,
        patientName: request.patientName,
        patientPhone: request.patientPhone,
        patientEmail: request.patientEmail,
        status: "confirmed",
        source: "whatsapp",
        scheduledAtUtc: request.proposedAtUtc,
        scheduledTimezone: request.requestedTimezone,
        rescheduledFrom: undefined, // This is the original, not a reschedule
        reminder24hSent: false,
        reminder2hSent: false,
        reminder24hScheduled: false,
        reminder2hScheduled: false,
        noShow: false,
        paymentStatus: "pending",
      };

      const reservation =
        await this.reservationRepository.create(reservationData);

      // Update request status to approved
      const updatedRequest =
        await this.reservationRequestRepository.updateStatus(
          requestId,
          "approved",
        );

      return {
        request: updatedRequest,
        reservation,
      };
    } else {
      // Reject the proposal - return to pending
      const updatedRequest =
        await this.reservationRequestRepository.updateStatus(
          requestId,
          "pending",
        );

      // Clear proposal details
      await this.reservationRequestRepository.clearProposal(requestId);

      return {
        request: updatedRequest,
      };
    }
  }

  async cancelReservation(reservationId: string, cancelledBy: string) {
    // This will be implemented when needed
    throw new BadRequestException(
      "Reservation cancellation not yet implemented",
    );
  }

  async expireRequest(
    requestId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const request =
        await this.reservationRequestRepository.findById(requestId);
      if (!request) {
        return { success: false, message: "Request not found" };
      }

      if (request.status !== "pending") {
        return {
          success: false,
          message: `Request is ${request.status}, cannot expire`,
        };
      }

      await this.reservationRequestRepository.updateStatus(
        requestId,
        "expired",
      );

      return { success: true, message: "Request expired successfully" };
    } catch (error) {
      console.error("Error expiring request:", error);
      return { success: false, message: "Error expiring request" };
    }
  }
}
