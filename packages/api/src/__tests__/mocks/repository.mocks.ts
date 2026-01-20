/**
 * Mock repository implementations for unit testing.
 * These mocks simulate the database operations without requiring a real database connection.
 */

/**
 * Mock data storage for testing.
 */
export const mockData = {
  reservationRequests: new Map<string, any>(),
  timeSlots: new Map<string, any>(),
  medicalServices: new Map<string, any>(),
  reservations: new Map<string, any>(),
};

/**
 * Reset all mock data before each test.
 */
export function resetMockData(): void {
  mockData.reservationRequests.clear();
  mockData.timeSlots.clear();
  mockData.medicalServices.clear();
  mockData.reservations.clear();
}

/**
 * Add test data to mocks.
 */
export function seedMockData(data: {
  reservationRequests?: any[];
  timeSlots?: any[];
  medicalServices?: any[];
  reservations?: any[];
}): void {
  if (data.reservationRequests) {
    data.reservationRequests.forEach((req) => {
      mockData.reservationRequests.set(req.id, req);
    });
  }
  if (data.timeSlots) {
    data.timeSlots.forEach((slot) => {
      mockData.timeSlots.set(slot.id, slot);
    });
  }
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
 * Mock TimeSlotRepository
 */
export class MockTimeSlotRepository {
  async create(data: any): Promise<any> {
    const slot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
    };
    mockData.timeSlots.set(slot.id, slot);
    return slot;
  }

  async findById(id: string): Promise<any | null> {
    return mockData.timeSlots.get(id) || null;
  }

  async findByProfileId(profileId: string): Promise<any[]> {
    return Array.from(mockData.timeSlots.values()).filter(
      (slot) => slot.profileId === profileId,
    );
  }

  async findByProfileIdAndDate(profileId: string, date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(mockData.timeSlots.values()).filter((slot) => {
      const slotTime = new Date(slot.startTime);
      return (
        slot.profileId === profileId &&
        slotTime >= startOfDay &&
        slotTime <= endOfDay
      );
    });
  }

  async findAvailableSlots(
    profileId: string,
    serviceId: string,
    date: Date,
  ): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return Array.from(mockData.timeSlots.values()).filter((slot) => {
      const slotTime = new Date(slot.startTime);
      return (
        slot.profileId === profileId &&
        slot.serviceId === serviceId &&
        slot.status === "available" &&
        slotTime >= startOfDay
      );
    });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const slot = mockData.timeSlots.get(id);
    if (slot) {
      slot.status = status;
      mockData.timeSlots.set(id, slot);
      return slot;
    }
    return null;
  }

  async incrementReservations(id: string): Promise<any> {
    const slot = mockData.timeSlots.get(id);
    if (slot) {
      slot.currentReservations = (slot.currentReservations || 0) + 1;
      mockData.timeSlots.set(id, slot);
      return slot;
    }
    return null;
  }

  async decrementReservations(id: string): Promise<any> {
    const slot = mockData.timeSlots.get(id);
    if (slot && slot.currentReservations > 0) {
      slot.currentReservations -= 1;
      mockData.timeSlots.set(id, slot);
      return slot;
    }
    return null;
  }

  async findExpiredPendingSlots(): Promise<any[]> {
    const now = new Date();
    return Array.from(mockData.timeSlots.values()).filter(
      (slot) =>
        slot.status === "pending_approval" &&
        slot.expiresAt &&
        new Date(slot.expiresAt) < now,
    );
  }

  async bulkCreate(slots: any[]): Promise<any[]> {
    const createdSlots = slots.map((slot) => ({
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...slot,
      createdAt: new Date(),
    }));
    createdSlots.forEach((slot) => mockData.timeSlots.set(slot.id, slot));
    return createdSlots;
  }
}

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

  async findBySlotId(slotId: string): Promise<any[]> {
    return Array.from(mockData.reservations.values()).filter(
      (res) => res.slotId === slotId,
    );
  }

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
