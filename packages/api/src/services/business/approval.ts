import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ReservationRequestRepository } from "../repository/reservation-request";
import { ReservationRepository } from "../repository/reservation";
import { ProfileRepository } from "../repository/profile";
import { StaffRepository } from "../repository/staff";
import { StaffServiceRepository } from "../repository/staff-service";
import { StaffAvailabilityRepository } from "../repository/staff-availability";
import { ServiceRepository } from "../repository/service";
import type { NewReservation } from "../../db/schema/reservation";
import { parse, getDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface ApproveRequestData {
  requestId: string;
  approvedBy: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  staffId?: string; // Optional: if not provided, no staff is assigned
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
    private staffRepository?: StaffRepository,
    private staffServiceRepository?: StaffServiceRepository,
    private staffAvailabilityRepository?: StaffAvailabilityRepository,
    private serviceRepository?: ServiceRepository,
  ) {}

  /**
   * Validate that a staff member is assigned to a specific service
   */
  async validateStaffServiceAssignment(
    staffId: string,
    serviceId: string,
  ): Promise<boolean> {
    if (!this.staffServiceRepository) {
      // If staff service repository is not available, skip validation
      console.warn("StaffServiceRepository not initialized, skipping validation");
      return true;
    }

    const isAssigned = await this.staffServiceRepository.isServiceAssignedToStaff(
      staffId,
      serviceId,
    );

    if (!isAssigned) {
      throw new BadRequestException(
        "El miembro del personal no está asignado a este servicio",
      );
    }

    return true;
  }

  /**
   * Validate that a staff member is available at the scheduled time
   */
  async validateStaffAvailability(
    staffId: string,
    scheduledAtUtc: Date,
    timezone: string,
  ): Promise<boolean> {
    if (!this.staffAvailabilityRepository || !this.staffRepository) {
      console.warn("Staff availability repository not initialized, skipping validation");
      return true;
    }

    // Check if staff exists and is active
    const staff = await this.staffRepository.findByIdAndProfile(staffId, "");
    if (!staff) {
      throw new NotFoundException("Miembro del personal no encontrado");
    }

    if (!staff.isActive) {
      throw new BadRequestException(
        "El miembro del personal no está activo",
      );
    }

    // Convert UTC time to local time in the staff's timezone
    const localTime = toZonedTime(scheduledAtUtc, timezone);
    const dayOfWeek = getDay(localTime); // 0 = Sunday, 1 = Monday, etc.

    // Get staff availability for this day
    const availability = await this.staffAvailabilityRepository.findByStaffAndDay(
      staffId,
      dayOfWeek,
    );

    if (!availability || !availability.isAvailable) {
      throw new BadRequestException(
        `El miembro del personal no está disponible el ${this.getDayName(dayOfWeek)}`,
      );
    }

    // Parse the time to check if within working hours
    const scheduledTime = `${localTime.getHours().toString().padStart(2, "0")}:${localTime.getMinutes().toString().padStart(2, "0")}`;

    if (scheduledTime < availability.startTime || scheduledTime > availability.endTime) {
      throw new BadRequestException(
        `El miembro del personal no está disponible a las ${scheduledTime}. Horario: ${availability.startTime} - ${availability.endTime}`,
      );
    }

    // Check if within break time
    if (availability.breaks && availability.breaks.length > 0) {
      for (const brk of availability.breaks) {
        if (scheduledTime >= brk.start && scheduledTime < brk.end) {
          throw new BadRequestException(
            `El miembro del personal está en descanso a las ${scheduledTime}`,
          );
        }
      }
    }

    return true;
  }

  /**
   * Check for double booking conflicts
   */
  async checkStaffDoubleBooking(
    staffId: string,
    scheduledAtUtc: Date,
    serviceId: string,
  ): Promise<boolean> {
    if (!this.serviceRepository || !this.reservationRepository) {
      console.warn("Service or reservation repository not initialized, skipping double booking check");
      return true;
    }

    // Get service duration
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Servicio no encontrado");
    }

    const duration = service.duration || 60;

    // Check for conflicts
    const conflicts = await this.reservationRepository.findConflictingForStaff(
      staffId,
      scheduledAtUtc,
      duration,
    );

    if (conflicts.length > 0) {
      throw new BadRequestException(
        "El miembro del personal ya tiene una cita programada a esta hora",
      );
    }

    return true;
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[dayOfWeek] || "desconocido";
  }

  async approveRequest(data: ApproveRequestData) {
    const {
      requestId,
      approvedBy,
      scheduledDate,
      scheduledTime,
      timezone,
      staffId,
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

    // If staffId is provided, validate staff assignment and availability
    if (staffId) {
      // Validate that the staff member is assigned to this service
      await this.validateStaffServiceAssignment(staffId, request.serviceId);

      // Validate staff availability at the scheduled time
      await this.validateStaffAvailability(staffId, scheduledAtUtc, timezone);

      // Check for double booking
      await this.checkStaffDoubleBooking(staffId, scheduledAtUtc, request.serviceId);
    }

    // Create reservation
    const reservationData: NewReservation = {
      profileId: request.profileId,
      serviceId: request.serviceId,
      staffId: staffId || null, // Add staff_id if provided
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
