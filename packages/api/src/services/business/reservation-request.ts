import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ReservationRequestRepository } from "../repository/reservation-request";
import { MedicalServiceRepository } from "../repository/medical-service";
import { AvailabilityValidationService } from "./availability-validation";
import type { NewReservationRequest } from "../../db/schema/reservation-request";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface CreateReservationRequestData {
  profileId: string;
  serviceId: string;
  preferredDate: string; // ISO date string "YYYY-MM-DD"
  preferredTime: string; // Time string "HH:MM"
  timezone: string; // IANA timezone string
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
  metadata?: {
    symptoms?: string[];
    urgencyLevel?: "low" | "normal" | "high" | "urgent";
    isNewPatient?: boolean;
    insuranceProvider?: string;
    notes?: string;
  };
}

export class ReservationRequestService {
  constructor(
    private reservationRequestRepository: ReservationRequestRepository,
    private medicalServiceRepository: MedicalServiceRepository,
    private availabilityValidationService: AvailabilityValidationService,
  ) {}

  async createRequest(data: CreateReservationRequestData) {
    const {
      profileId,
      serviceId,
      preferredDate,
      preferredTime,
      timezone,
      patientPhone,
    } = data;

    // Validate service exists
    const service = await this.medicalServiceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Medical service not found");
    }

    // Validate that the requested time is within business hours
    const validation =
      await this.availabilityValidationService.validateAgainstRules(
        profileId,
        preferredDate,
        preferredTime,
        timezone,
      );

    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    // Convert to UTC for storage
    const localDateTime = parse(
      `${preferredDate}T${preferredTime}:00`,
      "yyyy-MM-dd'T'HH:mm:ss",
      new Date(),
    );

    const preferredAtUtc = fromZonedTime(localDateTime, timezone);

    // Check if patient has existing pending request for the same time
    const existingRequests =
      await this.reservationRequestRepository.findByPatientPhone(patientPhone);
    const pendingForTime = existingRequests.find(
      (r) =>
        r.status === "pending" &&
        format(r.preferredAtUtc, "yyyy-MM-dd HH:mm") ===
          format(preferredAtUtc, "yyyy-MM-dd HH:mm"),
    );
    if (pendingForTime) {
      throw new BadRequestException(
        "Ya tienes una solicitud pendiente para esta fecha y hora",
      );
    }

    // Create reservation request
    const request: NewReservationRequest = {
      profileId,
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
      preferredAtUtc,
      requestedTimezone: timezone,
      metadata: data.metadata || {},
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const createdRequest =
      await this.reservationRequestRepository.create(request);

    return {
      request: createdRequest,
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

    // Fetch related service data
    const service = await this.medicalServiceRepository.findById(
      request.serviceId,
    );

    return {
      ...request,
      service,
    };
  }

  async getPendingRequests(profileId: string) {
    const requests =
      await this.reservationRequestRepository.findPendingByProfileId(profileId);

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const service = await this.medicalServiceRepository.findById(
          request.serviceId,
        );

        return {
          ...request,
          service,
        };
      }),
    );

    return enrichedRequests;
  }

  async getRequestsByStatus(
    status:
      | "pending"
      | "approved"
      | "rejected"
      | "expired"
      | "counter_proposed",
  ) {
    const requests =
      await this.reservationRequestRepository.findByStatus(status);

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const service = await this.medicalServiceRepository.findById(
          request.serviceId,
        );

        return {
          ...request,
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
        const service = await this.medicalServiceRepository.findById(
          request.serviceId,
        );

        return {
          ...request,
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
