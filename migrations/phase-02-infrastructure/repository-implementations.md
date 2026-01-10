# Inngest Repository Implementation

## Medical Service Repository Implementation

```typescript
// packages/api/src/services/repository/medical-service-repository.ts
import { db } from "../../db";
import { medicalService } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { MedicalService, NewMedicalService } from "../../db/schema";

export class MedicalServiceRepository {
  /**
   * Create a new medical service
   */
  async create(data: NewMedicalService): Promise<MedicalService> {
    const [service] = await db
      .insert(medicalService)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!service) {
      throw new Error("Failed to create medical service");
    }

    return service;
  }

  /**
   * Find service by ID
   */
  async findById(id: string): Promise<MedicalService | null> {
    const [service] = await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.id, id));

    return service || null;
  }

  /**
   * Find services by profile ID
   */
  async findByProfileId(profileId: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.profileId, profileId))
      .orderBy(desc(medicalService.createdAt));
  }

  /**
   * Find active services by profile ID
   */
  async findActiveByProfileId(profileId: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(
        and(
          eq(medicalService.profileId, profileId),
          eq(medicalService.isActive, true),
        ),
      )
      .orderBy(desc(medicalService.createdAt));
  }

  /**
   * Update service
   */
  async update(
    id: string,
    data: Partial<MedicalService>,
  ): Promise<MedicalService> {
    const [service] = await db
      .update(medicalService)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(medicalService.id, id))
      .returning();

    if (!service) {
      throw new Error("Service not found");
    }

    return service;
  }

  /**
   * Delete service (soft delete)
   */
  async delete(id: string): Promise<void> {
    await db
      .update(medicalService)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(medicalService.id, id));
  }

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: string): Promise<{
    totalBookings: number;
    completedAppointments: number;
    averageRating: number;
    revenue: number;
  }> {
    // This would join with reservation tables to get statistics
    // Implementation depends on reservation schema
    return {
      totalBookings: 0,
      completedAppointments: 0,
      averageRating: 0,
      revenue: 0,
    };
  }

  /**
   * Find services by category
   */
  async findByCategory(category: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(
        and(
          eq(medicalService.category, category),
          eq(medicalService.isActive, true),
        ),
      )
      .orderBy(desc(medicalService.createdAt));
  }
}
```

## Time Slot Repository Implementation

```typescript
// packages/api/src/services/repository/time-slot-repository.ts
import { db } from "../../db";
import { timeSlot } from "../../db/schema";
import { eq, and, between, gte, lte, desc, sql } from "drizzle-orm";
import type { TimeSlot, NewTimeSlot, SlotStatus } from "../../db/schema";

export class TimeSlotRepository {
  /**
   * Create a new time slot
   */
  async create(data: NewTimeSlot): Promise<TimeSlot> {
    const [slot] = await db
      .insert(timeSlot)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    if (!slot) {
      throw new Error("Failed to create time slot");
    }

    return slot;
  }

  /**
   * Find slot by ID
   */
  async findById(id: string): Promise<TimeSlot | null> {
    const [slot] = await db.select().from(timeSlot).where(eq(timeSlot.id, id));

    return slot || null;
  }

  /**
   * Find slots by profile ID and date
   */
  async findByProfileIdAndDate(
    profileId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.profileId, profileId),
          between(timeSlot.startTime, startOfDay, endOfDay),
        ),
      )
      .orderBy(timeSlot.startTime);
  }

  /**
   * Find available slots for specific service and date
   */
  async findAvailableSlots(
    profileId: string,
    serviceId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.profileId, profileId),
          eq(timeSlot.serviceId, serviceId),
          eq(timeSlot.status, "available"),
          gte(timeSlot.startTime, date),
        ),
      )
      .orderBy(timeSlot.startTime);
  }

  /**
   * Update slot status
   */
  async updateStatus(id: string, status: SlotStatus): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        status,
        expiresAt:
          status === "pending_approval"
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  /**
   * Increment reservation count
   */
  async incrementReservations(id: string): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`${timeSlot.currentReservations} + 1`,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  /**
   * Decrement reservation count
   */
  async decrementReservations(id: string): Promise<TimeSlot> {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`GREATEST(${timeSlot.currentReservations} - 1, 0)`,
      })
      .where(eq(timeSlot.id, id))
      .returning();

    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot;
  }

  /**
   * Find expired pending slots
   */
  async findExpiredPendingSlots(): Promise<TimeSlot[]> {
    const now = new Date();
    return await db
      .select()
      .from(timeSlot)
      .where(
        and(
          eq(timeSlot.status, "pending_approval"),
          lte(timeSlot.expiresAt, now),
        ),
      );
  }

  /**
   * Bulk create slots
   */
  async bulkCreate(slots: NewTimeSlot[]): Promise<TimeSlot[]> {
    const createdSlots = await db.insert(timeSlot).values(slots).returning();

    return createdSlots;
  }

  /**
   * Find slots that need to be generated for date
   */
  async findSlotsToGenerate(
    profileId: string,
    date: Date,
  ): Promise<{
    availabilityRules: any[];
    existingSlots: TimeSlot[];
  }> {
    // This would query availability rules and existing slots
    // Implementation depends on availability schema
    return {
      availabilityRules: [],
      existingSlots: [],
    };
  }
}
```

## Reservation Request Repository Implementation

```typescript
// packages/api/src/services/repository/reservation-request-repository.ts
import { db } from "../../db";
import { reservationRequest } from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  ReservationRequest,
  NewReservationRequest,
  RequestStatus,
} from "../../db/schema";

export class ReservationRequestRepository {
  /**
   * Create a new reservation request
   */
  async create(data: NewReservationRequest): Promise<ReservationRequest> {
    const [request] = await db
      .insert(reservationRequest)
      .values({
        ...data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!request) {
      throw new Error("Failed to create reservation request");
    }

    return request;
  }

  /**
   * Find request by ID
   */
  async findById(id: string): Promise<ReservationRequest | null> {
    const [request] = await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.id, id));

    return request || null;
  }

  /**
   * Find pending requests by profile ID
   */
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

  /**
   * Find requests by patient phone
   */
  async findByPatientPhone(
    patientPhone: string,
  ): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.patientPhone, patientPhone))
      .orderBy(desc(reservationRequest.createdAt));
  }

  /**
   * Update request status
   */
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

  /**
   * Find expired requests
   */
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

  /**
   * Count pending requests by profile
   */
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

  /**
   * Find requests by status
   */
  async findByStatus(status: RequestStatus): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.status, status))
      .orderBy(desc(reservationRequest.createdAt));
  }

  /**
   * Get requests for date range
   */
  async findByDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReservationRequest[]> {
    return await db
      .select()
      .from(reservationRequest)
      .where(
        and(
          eq(reservationRequest.profileId, profileId),
          sql`${reservationRequest.createdAt} >= ${startDate}`,
          sql`${reservationRequest.createdAt} <= ${endDate}`,
        ),
      )
      .orderBy(desc(reservationRequest.createdAt));
  }
}
```

## Service Registration Implementation

```typescript
// packages/api/src/plugins/services.ts
import { Elysia } from "elysia";

// Repository imports
import { MedicalServiceRepository } from "../services/repository/medical-service-repository";
import { TimeSlotRepository } from "../services/repository/time-slot-repository";
import { ReservationRequestRepository } from "../services/repository/reservation-request-repository";

// Business service imports
import { MedicalService } from "../services/business/medical-service";
import { ReservationService } from "../services/business/reservation-service";
import { AvailabilityService } from "../services/business/availability-service";

// Inngest imports
import { InngestEventService } from "../services/ingest/inngest-event-service";

export const servicesPlugin = new Elysia({
  name: "services",
})
  // ===== REPOSITORY LAYER =====
  .decorate("medicalServiceRepository", new MedicalServiceRepository())
  .decorate("timeSlotRepository", new TimeSlotRepository())
  .decorate("reservationRequestRepository", new ReservationRequestRepository())

  // ===== BUSINESS SERVICE LAYER =====
  .decorate("medicalService", new MedicalService())
  .decorate("reservationService", new ReservationService())
  .decorate("availabilityService", new AvailabilityService())

  // ===== INNGEST INTEGRATION =====
  .decorate("inngestEventService", new InngestEventService())

  // ===== LEGACY SERVICES (TO BE MIGRATED) =====
  // Keep existing services until full migration
  // .decorate("campaignService", new CampaignService())
  // .decorate("whatsappService", new WhatsAppService())

  .derive(({ medicalServiceRepository, inngestEventService }) => {
    // Initialize services with their dependencies
    const medicalService = new MedicalService(
      medicalServiceRepository,
      inngestEventService,
    );

    return {
      medicalService,
      // Add other services with dependencies
    };
  });
```

## Configuration Files

### Inngest Environment Variables

```bash
# .env.local
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_APP_ID=medical-chatbot-platform
INNGEST_BASE_URL=https://api.inngest.com
INNGEST_DEV_SERVER_URL=http://localhost:8288
```

### TypeScript Types

```typescript
// packages/api/src/types/services.ts
export interface ServiceContext {
  medicalServiceRepository: MedicalServiceRepository;
  timeSlotRepository: TimeSlotRepository;
  reservationRequestRepository: ReservationRequestRepository;
  medicalService: MedicalService;
  reservationService: ReservationService;
  availabilityService: AvailabilityService;
  inngestEventService: InngestEventService;
}
```

## Next Implementation Steps

1. **Implement AvailabilityService** for managing doctor availability rules
2. **Create Inngest workflow functions** for automation
3. **Build API routes** for medical reservation endpoints
4. **Add validation logic** for business rules
5. **Create unit tests** for all services
