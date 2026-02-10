/**
 * Mock repository implementations for unit testing.
 * These mocks simulate the database operations without requiring a real database connection.
 */

/**
 * Mock data storage for testing.
 */
export const mockData = {
  reservationRequests: new Map<string, any>(),
  // timeSlots: REMOVED - availability simplified, no pre-generated slots
  medicalServices: new Map<string, any>(),
  reservations: new Map<string, any>(),
};

/**
 * Reset all mock data before each test.
 */
export function resetMockData(): void {
  mockData.reservationRequests.clear();
  // timeSlots: REMOVED - availability simplified
  mockData.medicalServices.clear();
  mockData.reservations.clear();
}

/**
 * Add test data to mocks.
 */
export function seedMockData(data: {
  reservationRequests?: any[];
  // timeSlots: REMOVED - availability simplified
  medicalServices?: any[];
  reservations?: any[];
}): void {
  if (data.reservationRequests) {
    data.reservationRequests.forEach((req) => {
      mockData.reservationRequests.set(req.id, req);
    });
  }
  // timeSlots: REMOVED - availability simplified
  if (data.medicalServices) {
    data.medicalServices.forEach((service) => {
      mockData.medicalServices.set(service.id, service);
    });
  }
  if (data.reservations) {
    data.reservations.forEach((res) => {
      mockData.reservations.set(res.id, res);
    });
  }
}

/**
 * Mock TimeSlotRepository: REMOVED - availability simplified, no pre-generated slots
 */

/**
 * Mock MedicalServiceRepository
 */
export class MockMedicalServiceRepository {
  async findById(id: string): Promise<any | null> {
    return mockData.medicalServices.get(id) || null;
  }

  async findByProfileId(profileId: string): Promise<any[]> {
    return Array.from(mockData.medicalServices.values()).filter(
      (service) => service.profileId === profileId,
    );
  }
}

/**
 * Mock ReservationRequestRepository
 */
export class MockReservationRequestRepository {
  async create(data: any): Promise<any> {
    const request = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockData.reservationRequests.set(request.id, request);
    return request;
  }

  async findById(id: string): Promise<any | null> {
    return mockData.reservationRequests.get(id) || null;
  }

  async findByPatientPhone(phone: string): Promise<any[]> {
    return Array.from(mockData.reservationRequests.values()).filter(
      (req) => req.patientPhone === phone,
    );
  }

  async findPendingByProfileId(profileId: string): Promise<any[]> {
    return Array.from(mockData.reservationRequests.values()).filter(
      (req) => req.profileId === profileId && req.status === "pending",
    );
  }

  async findByStatus(status: string): Promise<any[]> {
    return Array.from(mockData.reservationRequests.values()).filter(
      (req) => req.status === status,
    );
  }

  async countPendingByProfileId(profileId: string): Promise<number> {
    return Array.from(mockData.reservationRequests.values()).filter(
      (req) => req.profileId === profileId && req.status === "pending",
    ).length;
  }

  async findExpiredRequests(): Promise<any[]> {
    const now = new Date();
    return Array.from(mockData.reservationRequests.values()).filter(
      (req) => req.status === "pending" && new Date(req.expiresAt) < now,
    );
  }

  async updateStatus(
    id: string,
    status: string,
    processedBy?: string,
    rejectionReason?: string,
  ): Promise<any> {
    const request = mockData.reservationRequests.get(id);
    if (request) {
      request.status = status;
      request.processedBy = processedBy;
      request.rejectionReason = rejectionReason;
      request.updatedAt = new Date();
      mockData.reservationRequests.set(id, request);
      return request;
    }
    return null;
  }
}

/**
 * Mock ReservationRepository
 */
export class MockReservationRepository {
  async create(data: any): Promise<any> {
    const reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockData.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async findById(id: string): Promise<any | null> {
    return mockData.reservations.get(id) || null;
  }

  async findByProfileId(profileId: string): Promise<any[]> {
    return Array.from(mockData.reservations.values()).filter(
      (res) => res.profileId === profileId,
    );
  }

  // findBySlotId: REMOVED - availability simplified, no slot-based reservations

  async findByPatientPhone(phone: string): Promise<any[]> {
    return Array.from(mockData.reservations.values()).filter(
      (res) => res.patientPhone === phone,
    );
  }

  async findByStatus(status: string): Promise<any[]> {
    return Array.from(mockData.reservations.values()).filter(
      (res) => res.status === status,
    );
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const reservation = mockData.reservations.get(id);
    if (reservation) {
      reservation.status = status;
      reservation.updatedAt = new Date();
      mockData.reservations.set(id, reservation);
      return reservation;
    }
    return null;
  }

  async markAsCompleted(id: string): Promise<any> {
    const reservation = mockData.reservations.get(id);
    if (reservation) {
      reservation.status = "completed";
      reservation.completedAt = new Date();
      reservation.updatedAt = new Date();
      mockData.reservations.set(id, reservation);
      return reservation;
    }
    return null;
  }

  async markAsNoShow(id: string): Promise<any> {
    const reservation = mockData.reservations.get(id);
    if (reservation) {
      reservation.status = "no_show";
      reservation.noShow = true;
      reservation.updatedAt = new Date();
      mockData.reservations.set(id, reservation);
      return reservation;
    }
    return null;
  }

  async cancelReservation(id: string, cancelledBy: string): Promise<any> {
    const reservation = mockData.reservations.get(id);
    if (reservation) {
      reservation.status = "cancelled";
      reservation.cancelledBy = cancelledBy;
      reservation.cancelledAt = new Date();
      reservation.updatedAt = new Date();
      mockData.reservations.set(id, reservation);
      return reservation;
    }
    return null;
  }

  async updateReminderFlags(
    id: string,
    flags: { reminder24hSent?: boolean; reminder2hSent?: boolean },
  ): Promise<any> {
    const reservation = mockData.reservations.get(id);
    if (reservation) {
      Object.assign(reservation, flags);
      reservation.updatedAt = new Date();
      mockData.reservations.set(id, reservation);
      return reservation;
    }
    return null;
  }
}
