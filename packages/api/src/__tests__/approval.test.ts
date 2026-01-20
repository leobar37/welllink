import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { ApprovalService } from "../services/business/approval";
import {
  MockReservationRequestRepository,
  MockTimeSlotRepository,
  MockReservationRepository,
  resetMockData,
  seedMockData,
} from "./mocks/repository.mocks";
import { enableMockMode, disableMockMode } from "../lib/inngest-client";

/**
 * Unit tests for ApprovalService
 * Tests the business logic for approving and rejecting reservation requests.
 */
describe("ApprovalService", () => {
  let service: ApprovalService;
  let requestRepo: MockReservationRequestRepository;
  let slotRepo: MockTimeSlotRepository;
  let reservationRepo: MockReservationRepository;

  beforeEach(() => {
    // Reset mock data before each test
    resetMockData();

    // Enable mock mode for Inngest
    enableMockMode();

    // Create fresh repository instances
    requestRepo = new MockReservationRequestRepository();
    slotRepo = new MockTimeSlotRepository();
    reservationRepo = new MockReservationRepository();

    // Create service with mock repositories
    service = new ApprovalService(requestRepo, slotRepo, reservationRepo);
  });

  afterEach(() => {
    // Disable mock mode after each test
    disableMockMode();
  });

  /**
   * Test: Approve reservation request successfully
   */
  it("should approve request and create reservation", async () => {
    // Setup: Seed a pending request
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          patientEmail: "juan@test.com",
          status: "pending",
          requestedTime: new Date(Date.now() + 86400000),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 86400000 + 1800000),
          status: "pending_approval",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
    });

    const result = await service.approveRequest({
      requestId: "req-1",
      approvedBy: "doctor@wellness.com",
      notes: "Approved for consultation",
    });

    // Verify request was approved
    expect(result.request.status).toBe("approved");

    // Verify reservation was created
    expect(result.reservation).toBeDefined();
    expect(result.reservation.patientName).toBe("Juan Pérez");
    expect(result.reservation.status).toBe("confirmed");
    expect(result.reservation.notes).toBe("Approved for consultation");

    // Verify slot was updated
    expect(result.slot).not.toBeNull();
    if (result.slot) {
      expect(result.slot.status).toBe("reserved");
      expect(result.slot.currentReservations).toBe(1);
    }
  });

  /**
   * Test: Fail when approving non-existent request
   */
  it("should throw NotFoundException for non-existent request", async () => {
    await expect(
      service.approveRequest({
        requestId: "non-existent-req",
        approvedBy: "doctor@wellness.com",
      }),
    ).rejects.toThrow("Reservation request not found");
  });

  /**
   * Test: Fail when approving already approved request
   */
  it("should throw BadRequestException for already approved request", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "approved", // Already approved
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "reserved",
          currentReservations: 1,
          maxReservations: 1,
        },
      ],
    });

    await expect(
      service.approveRequest({
        requestId: "req-1",
        approvedBy: "doctor@wellness.com",
      }),
    ).rejects.toThrow("Request is approved, cannot be approved");
  });

  /**
   * Test: Fail when rejecting already approved request
   */
  it("should throw BadRequestException for already approved request", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "approved",
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "reserved",
          currentReservations: 1,
          maxReservations: 1,
        },
      ],
    });

    await expect(
      service.rejectRequest({
        requestId: "req-1",
        rejectedBy: "doctor@wellness.com",
        rejectionReason: "Test reason",
      }),
    ).rejects.toThrow("Request is approved, cannot be rejected");
  });

  /**
   * Test: Expire pending request
   */
  it("should expire pending request and release slot", async () => {
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
          requestedTime: new Date(Date.now() - 7200000),
          expiresAt: new Date(Date.now() - 3600000), // Expired
        },
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "pending_approval",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
    });

    const result = await service.expireRequest("req-1");

    // Verify request was expired
    expect(result.request.status).toBe("expired");

    // Verify slot is available again
    expect(result.slot.status).toBe("available");
  });

  /**
   * Test: Expire non-pending request returns failure
   */
  it("should return failure when expiring non-pending request", async () => {
    seedMockData({
      reservationRequests: [
        {
          id: "req-1",
          profileId: "profile-1",
          slotId: "slot-1",
          serviceId: "service-1",
          patientName: "Juan Pérez",
          patientPhone: "+5491123456789",
          status: "approved", // Not pending
          requestedTime: new Date(),
          expiresAt: new Date(Date.now() + 1800000),
        },
      ],
    });

    const result = await service.expireRequest("req-1");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Request not pending");
  });

  /**
   * Test: Reservation increments slot capacity
   */
  it("should increment slot currentReservations after approval", async () => {
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
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "pending_approval",
          currentReservations: 0,
          maxReservations: 2, // Can hold 2 reservations
        },
      ],
    });

    await service.approveRequest({
      requestId: "req-1",
      approvedBy: "doctor@wellness.com",
    });

    // Verify slot has 1 reservation
    const slot = await slotRepo.findById("slot-1");
    expect(slot.currentReservations).toBe(1);
  });

  /**
   * Test: Rejection releases slot without incrementing capacity
   */
  it("should not increment slot capacity on rejection", async () => {
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
      ],
      timeSlots: [
        {
          id: "slot-1",
          profileId: "profile-1",
          startTime: new Date(),
          status: "pending_approval",
          currentReservations: 0,
          maxReservations: 1,
        },
      ],
    });

    await service.rejectRequest({
      requestId: "req-1",
      rejectedBy: "doctor@wellness.com",
      rejectionReason: "Test",
    });

    // Verify slot still has 0 reservations
    const slot = await slotRepo.findById("slot-1");
    expect(slot.currentReservations).toBe(0);
  });
});
