import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  ReservationRequestService,
  type CreateReservationRequestData,
} from "../services/business/reservation-request";
import {
  MockReservationRequestRepository,
  MockTimeSlotRepository,
  MockMedicalServiceRepository,
  resetMockData,
  seedMockData,
} from "./mocks/repository.mocks";
import { enableMockMode, disableMockMode } from "../lib/inngest-client";

/**
 * Unit tests for ReservationRequestService
 * Tests the business logic for creating and managing reservation requests.
 */
describe("ReservationRequestService", () => {
  let service: ReservationRequestService;
  let requestRepo: MockReservationRequestRepository;
  let slotRepo: MockTimeSlotRepository;
  let serviceRepo: MockMedicalServiceRepository;

  beforeEach(() => {
    // Reset mock data before each test
    resetMockData();

    // Enable mock mode for Inngest
    enableMockMode();

    // Create fresh repository instances
    requestRepo = new MockReservationRequestRepository();
    slotRepo = new MockTimeSlotRepository();
    serviceRepo = new MockMedicalServiceRepository();

    // Create service with mock repositories
    service = new ReservationRequestService(requestRepo, slotRepo, serviceRepo);
  });

  afterEach(() => {
    // Disable mock mode after each test
    disableMockMode();
  });

  /**
   * Test: Create reservation request successfully
   */
  it("should create reservation request with valid data", async () => {
    // Setup: Seed available slot and service
    seedMockData({
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(Date.now() + 86400000), // Tomorrow
          endTime: new Date(Date.now() + 86400000 + 1800000),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta General",
          duration: 30,
          price: 1500,
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-1",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
      patientEmail: "juan@test.com",
      patientAge: 35,
      patientGender: "male",
      chiefComplaint: "Dolor de cabeza",
      urgencyLevel: "normal",
    };

    const result = await service.createRequest(requestData);

    // Verify request was created
    expect(result.request).toBeDefined();
    expect(result.request.patientName).toBe("Juan Pérez");
    expect(result.request.patientPhone).toBe("+5491123456789");
    expect(result.request.status).toBe("pending");
    expect(result.request.urgencyLevel).toBe("normal");

    // Verify slot was updated
    expect(result.slot.status).toBe("pending_approval");
  });

  /**
   * Test: Create request with different urgency levels
   */
  it("should create requests with different urgency levels", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-normal",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
        {
          id: "slot-urgent",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
    });

    // Test normal urgency
    const normalResult = await service.createRequest({
      slotId: "slot-normal",
      serviceId: "service-1",
      patientName: "Paciente Normal",
      patientPhone: "+5491111111111",
      urgencyLevel: "normal",
    });
    expect(normalResult.request.urgencyLevel).toBe("normal");

    // Test urgent
    const urgentResult = await service.createRequest({
      slotId: "slot-urgent",
      serviceId: "service-1",
      patientName: "Paciente Urgente",
      patientPhone: "+5491222222222",
      urgencyLevel: "urgent",
    });
    expect(urgentResult.request.urgencyLevel).toBe("urgent");
  });

  /**
   * Test: Fail when slot does not exist
   */
  it("should throw NotFoundException when slot does not exist", async () => {
    const requestData: CreateReservationRequestData = {
      slotId: "non-existent-slot",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "Time slot not found",
    );
  });

  /**
   * Test: Fail when slot is not available
   */
  it("should throw BadRequestException when slot is not available", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-reserved",
          profileId: "profile-1",
          startTime: new Date(),
          status: "reserved",
          currentReservations: 1,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-reserved",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "This time slot is not available for booking",
    );
  });

  /**
   * Test: Fail when slot is pending_approval
   */
  it("should throw BadRequestException when slot is pending_approval", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-pending",
          profileId: "profile-1",
          startTime: new Date(),
          status: "pending_approval",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-pending",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "This time slot is not available for booking",
    );
  });

  /**
   * Test: Fail when slot is fully booked
   */
  it("should throw BadRequestException when slot is fully booked", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-full",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 2,
          maxReservations: 2,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-full",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "This time slot is fully booked",
    );
  });

  /**
   * Test: Fail when service does not exist
   */
  it("should throw NotFoundException when service does not exist", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-1",
      serviceId: "non-existent-service",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "Medical service not found",
    );
  });

  /**
   * Test: Fail when patient already has pending request for same slot
   */
  it("should throw BadRequestException for duplicate pending request", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
      reservationRequests: [
        {
          id: "existing-req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-1",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789", // Same phone
    };

    await expect(service.createRequest(requestData)).rejects.toThrow(
      "You already have a pending request for this time slot",
    );
  });

  /**
   * Test: Allow new request for same slot with different patient
   */
  it("should allow request for same slot with different patient phone", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 2,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
      reservationRequests: [
        {
          id: "existing-req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491111111111",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const requestData: CreateReservationRequestData = {
      slotId: "slot-1",
      serviceId: "service-1",
      patientName: "María García",
      patientPhone: "+5491222222222", // Different phone
    };

    const result = await service.createRequest(requestData);

    expect(result.request).toBeDefined();
    expect(result.request.patientPhone).toBe("+5491222222222");
  });

  /**
   * Test: Request expiration is set to 30 minutes
   */
  it("should set request expiration to 30 minutes from now", async () => {
    seedMockData({
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "available",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
      medicalServices: [
        {
          id: "service-1",
          name: "Consulta",
          duration: 30,
          price: 1500,
        },
      ],
    });

    const beforeRequest = new Date();

    const result = await service.createRequest({
      slotId: "slot-1",
      serviceId: "service-1",
      patientName: "Juan Pérez",
      patientPhone: "+5491123456789",
    });

    const expiresAt = new Date(result.request.expiresAt);
    const afterRequest = new Date();

    const diffMs = expiresAt.getTime() - beforeRequest.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Should be approximately 30 minutes (allow 1 minute tolerance)
    expect(diffMinutes).toBeGreaterThan(29);
    expect(diffMinutes).toBeLessThan(31);
  });

  /**
   * Test: Get pending requests by profile
   */
  it("should return pending requests for profile", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491111111111",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-2",
          profileId: "profile-1",
          slotId: "slot-2",
          serviceId: "service-1",
          patientName: "María García",
          patientPhone: "+5491222222222",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-3",
          profileId: "profile-2",
          slotId: "slot-3",
          serviceId: "service-1",
          patientName: "Carlos Rodríguez",
          patientPhone: "+5491333333333",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const pendingRequests = await service.getPendingRequests("profile-1");

    expect(pendingRequests.length).toBe(2);
    expect(pendingRequests.every((req) => req.profileId === "profile-1")).toBe(
      true,
    );
    expect(pendingRequests.every((req) => req.status === "pending")).toBe(true);
  });

  /**
   * Test: Get patient history by phone
   */
  it("should return all requests for patient phone", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-2",
          profileId: "profile-1",
          slotId: "slot-2",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "approved",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-3",
          profileId: "profile-2",
          slotId: "slot-3",
          serviceId: "service-1",
          patientName: "María García",
          patientPhone: "+5491222222222",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const history = await service.getPatientHistory("+5491123456789");

    expect(history.length).toBe(2);
    expect(history.every((req) => req.patientPhone === "+5491123456789")).toBe(
      true,
    );
  });

  /**
   * Test: Get request stats
   */
  it("should return correct pending count", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491111111111",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-2",
          profileId: "profile-1",
          slotId: "slot-2",
          serviceId: "service-1",
          patientName: "María García",
          patientPhone: "+5491222222222",
          status: "pending",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
        {
          id: "req-3",
          profileId: "profile-1",
          slotId: "slot-3",
          serviceId: "service-1",
          patientName: "Carlos Rodríguez",
          patientPhone: "+5491333333333",
          status: "approved",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const stats = await service.getStats("profile-1");

    expect(stats.pending).toBe(2);
  });
});
