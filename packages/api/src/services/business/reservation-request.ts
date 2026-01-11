import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ReservationRequestRepository } from "../repository/reservation-request";
import { TimeSlotRepository } from "../repository/time-slot";
import { MedicalServiceRepository } from "../repository/medical-service";
import type { NewReservationRequest } from "../../db/schema/reservation-request";

export interface CreateReservationRequestData {
  slotId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  chiefComplaint?: string;
  symptoms?: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  urgencyLevel?: "low" | "normal" | "high" | "urgent";
}

export class ReservationRequestService {
  constructor(
    private reservationRequestRepository: ReservationRequestRepository,
    private timeSlotRepository: TimeSlotRepository,
    private medicalServiceRepository: MedicalServiceRepository,
  ) {}

  async createRequest(data: CreateReservationRequestData) {
    const { slotId, serviceId, patientPhone } = data;

    // Validate slot availability
    const slot = await this.timeSlotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundException("Time slot not found");
    }

    if (slot.status !== "available") {
      throw new BadRequestException(
        "This time slot is not available for booking",
      );
    }

    // Validate service exists
    const service = await this.medicalServiceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Medical service not found");
    }

    // Check slot capacity
    if (slot.currentReservations >= slot.maxReservations) {
      throw new BadRequestException("This time slot is fully booked");
    }

    // Check if patient has existing pending request for this slot
    const existingRequest =
      await this.reservationRequestRepository.findByPatientPhone(patientPhone);
    const pendingForSlot = existingRequest.find(
      (r) => r.slotId === slotId && r.status === "pending",
    );
    if (pendingForSlot) {
      throw new BadRequestException(
        "You already have a pending request for this time slot",
      );
    }

    // Create reservation request
    const request: NewReservationRequest = {
      profileId: slot.profileId,
      slotId,
      serviceId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      chiefComplaint: data.chiefComplaint,
      symptoms: data.symptoms,
      medicalHistory: data.medicalHistory,
      currentMedications: data.currentMedications,
      allergies: data.allergies,
      urgencyLevel: data.urgencyLevel || "normal",
      status: "pending",
      requestedTime: slot.startTime,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    const createdRequest =
      await this.reservationRequestRepository.create(request);

    // Update slot status to pending approval
    await this.timeSlotRepository.updateStatus(slotId, "pending_approval");

    return {
      request: createdRequest,
      slot,
      service,
    };
  }

  async getRequestById(requestId: string, profileId?: string) {
    const request = await this.reservationRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException("Reservation request not found");
    }

    // Check authorization if profileId is provided
    if (profileId && request.profileId !== profileId) {
      throw new BadRequestException(
        "You are not authorized to view this request",
      );
    }

    // Fetch related data
    const [slot, service] = await Promise.all([
      this.timeSlotRepository.findById(request.slotId),
      this.medicalServiceRepository.findById(request.serviceId),
    ]);

    return {
      ...request,
      slot,
      service,
    };
  }

  async getPendingRequests(profileId: string) {
    const requests =
      await this.reservationRequestRepository.findPendingByProfileId(profileId);

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [slot, service] = await Promise.all([
          this.timeSlotRepository.findById(request.slotId),
          this.medicalServiceRepository.findById(request.serviceId),
        ]);

        return {
          ...request,
          slot,
          service,
        };
      }),
    );

    return enrichedRequests;
  }

  async getRequestsByStatus(
    status: "pending" | "approved" | "rejected" | "expired",
  ) {
    const requests =
      await this.reservationRequestRepository.findByStatus(status);

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [slot, service] = await Promise.all([
          this.timeSlotRepository.findById(request.slotId),
          this.medicalServiceRepository.findById(request.serviceId),
        ]);

        return {
          ...request,
          slot,
          service,
        };
      }),
    );

    return enrichedRequests;
  }

  async getPatientHistory(patientPhone: string) {
    const requests =
      await this.reservationRequestRepository.findByPatientPhone(patientPhone);

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [slot, service] = await Promise.all([
          this.timeSlotRepository.findById(request.slotId),
          this.medicalServiceRepository.findById(request.serviceId),
        ]);

        return {
          ...request,
          slot,
          service,
        };
      }),
    );

    return enrichedRequests;
  }

  async getStats(profileId: string) {
    const pendingCount =
      await this.reservationRequestRepository.countPendingByProfileId(
        profileId,
      );

    return {
      pending: pendingCount,
      approved: 0, // TODO: Implement count
      rejected: 0, // TODO: Implement count
      expired: 0, // TODO: Implement count
    };
  }
}
