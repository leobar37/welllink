# Service Layer Architecture - Medical Reservation System

## Overview

This defines the service layer architecture for the medical reservation system, including repositories, business services, and the transition from BullMQ to Inngest.

## Repository Layer

### Medical Service Repository

```typescript
// packages/api/src/services/repository/medical-service-repository.ts
import { db } from "../../db";
import { medicalService } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export class MedicalServiceRepository {
  async create(data: NewMedicalService) {
    const [service] = await db.insert(medicalService).values(data).returning();
    return service;
  }

  async findById(id: string) {
    const [service] = await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.id, id));
    return service;
  }

  async findByProfileId(profileId: string) {
    return await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.profileId, profileId));
  }

  async findActiveByProfileId(profileId: string) {
    return await db
      .select()
      .from(medicalService)
      .where(
        and(
          eq(medicalService.profileId, profileId),
          eq(medicalService.isActive, true),
        ),
      );
  }

  async update(id: string, data: Partial<MedicalService>) {
    const [service] = await db
      .update(medicalService)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(medicalService.id, id))
      .returning();
    return service;
  }

  async delete(id: string) {
    await db.delete(medicalService).where(eq(medicalService.id, id));
  }
}
```

### Time Slot Repository

```typescript
// packages/api/src/services/repository/time-slot-repository.ts
import { db } from "../../db";
import { timeSlot } from "../../db/schema";
import { eq, and, between, gte, lte } from "drizzle-orm";

export class TimeSlotRepository {
  async create(data: NewTimeSlot) {
    const [slot] = await db.insert(timeSlot).values(data).returning();
    return slot;
  }

  async findById(id: string) {
    const [slot] = await db.select().from(timeSlot).where(eq(timeSlot.id, id));
    return slot;
  }

  async findByProfileIdAndDate(profileId: string, date: Date) {
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

  async findAvailableSlots(profileId: string, serviceId: string, date: Date) {
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

  async updateStatus(id: string, status: SlotStatus) {
    const [slot] = await db
      .update(timeSlot)
      .set({
        status,
        updatedAt: new Date(),
        expiresAt:
          status === "pending_approval"
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null,
      })
      .where(eq(timeSlot.id, id))
      .returning();
    return slot;
  }

  async incrementReservations(id: string) {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`${timeSlot.currentReservations} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(timeSlot.id, id))
      .returning();
    return slot;
  }

  async decrementReservations(id: string) {
    const [slot] = await db
      .update(timeSlot)
      .set({
        currentReservations: sql`${timeSlot.currentReservations} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(timeSlot.id, id))
      .returning();
    return slot;
  }

  async findExpiredPendingSlots() {
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
}
```

### Reservation Request Repository

```typescript
// packages/api/src/services/repository/reservation-request-repository.ts
import { db } from "../../db";
import { reservationRequest } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export class ReservationRequestRepository {
  async create(data: NewReservationRequest) {
    const [request] = await db
      .insert(reservationRequest)
      .values({
        ...data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      })
      .returning();
    return request;
  }

  async findById(id: string) {
    const [request] = await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.id, id));
    return request;
  }

  async findPendingByProfileId(profileId: string) {
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

  async findByPatientPhone(patientPhone: string) {
    return await db
      .select()
      .from(reservationRequest)
      .where(eq(reservationRequest.patientPhone, patientPhone))
      .orderBy(desc(reservationRequest.createdAt));
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    approvedBy?: string,
    rejectionReason?: string,
  ) {
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

    return request;
  }

  async findExpiredRequests() {
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

  async countPendingByProfileId(profileId: string) {
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
}
```

## Business Service Layer

### Medical Service Business Logic

```typescript
// packages/api/src/services/business/medical-service.ts
import { MedicalServiceRepository } from "../repository/medical-service-repository";
import { InngestEventService } from "../ingest/inngest-event-service";

export class MedicalService {
  constructor(
    private medicalServiceRepo: MedicalServiceRepository,
    private inngestEventService: InngestEventService,
  ) {}

  async createService(profileId: string, data: NewMedicalService) {
    // Validate service data
    this.validateServiceData(data);

    // Create service
    const service = await this.medicalServiceRepo.create({
      ...data,
      profileId,
    });

    // Log activity
    await this.logActivity("service_created", {
      serviceId: service.id,
      profileId,
    });

    return service;
  }

  async updateService(
    serviceId: string,
    profileId: string,
    data: Partial<MedicalService>,
  ) {
    // Verify ownership
    const service = await this.medicalServiceRepo.findById(serviceId);
    if (!service || service.profileId !== profileId) {
      throw new Error("Service not found or unauthorized");
    }

    // Update service
    const updated = await this.medicalServiceRepo.update(serviceId, data);

    // Log activity
    await this.logActivity("service_updated", { serviceId, profileId });

    return updated;
  }

  async getServicesByProfile(profileId: string) {
    return await this.medicalServiceRepo.findActiveByProfileId(profileId);
  }

  async getServiceWithStats(serviceId: string) {
    const service = await this.medicalServiceRepo.findById(serviceId);
    if (!service) return null;

    // Get booking statistics
    const stats = await this.getServiceStatistics(serviceId);

    return {
      ...service,
      statistics: stats,
    };
  }

  private validateServiceData(data: NewMedicalService) {
    if (!data.name || data.name.length < 3) {
      throw new Error("Service name must be at least 3 characters");
    }

    if (!data.duration || data.duration < 15) {
      throw new Error("Service duration must be at least 15 minutes");
    }

    if (data.price && data.price < 0) {
      throw new Error("Service price cannot be negative");
    }
  }

  private async logActivity(type: string, data: any) {
    // Implementation for activity logging
    console.log(`[MedicalService] ${type}:`, data);
  }

  private async getServiceStatistics(serviceId: string) {
    // Implementation for service statistics
    // This would query reservation data to get booking stats
    return {
      totalBookings: 0,
      completedAppointments: 0,
      averageRating: 0,
      revenue: 0,
    };
  }
}
```

### Reservation Service Business Logic

```typescript
// packages/api/src/services/business/reservation-service.ts
import { ReservationRequestRepository } from "../repository/reservation-request-repository";
import { TimeSlotRepository } from "../repository/time-slot-repository";
import { InngestEventService } from "../ingest/inngest-event-service";
import { WhatsAppService } from "../business/whatsapp-service";

export class ReservationService {
  constructor(
    private reservationRequestRepo: ReservationRequestRepository,
    private timeSlotRepo: TimeSlotRepository,
    private inngestEventService: InngestEventService,
    private whatsappService: WhatsAppService,
  ) {}

  async createReservationRequest(
    profileId: string,
    data: {
      slotId: string;
      serviceId: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      chiefComplaint?: string;
      symptoms?: string;
      medicalHistory?: string;
      urgencyLevel?: string;
    },
  ) {
    // Validate slot availability
    const slot = await this.timeSlotRepo.findById(data.slotId);
    if (!slot || slot.status !== "available") {
      throw new Error("Time slot not available");
    }

    // Check if slot is full
    if (slot.currentReservations >= slot.maxReservations) {
      throw new Error("Time slot is fully booked");
    }

    // Create reservation request
    const request = await this.reservationRequestRepo.create({
      profileId,
      slotId: data.slotId,
      serviceId: data.serviceId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail,
      chiefComplaint: data.chiefComplaint,
      symptoms: data.symptoms,
      medicalHistory: data.medicalHistory,
      urgencyLevel: data.urgencyLevel || "normal",
    });

    // Update slot status to pending approval
    await this.timeSlotRepo.updateStatus(data.slotId, "pending_approval");

    // Send notification to doctor
    await this.notifyDoctorOfNewRequest(request);

    // Schedule Inngest workflow for approval timeout
    await this.inngestEventService.sendReservationCreated({
      reservationId: request.id,
      profileId,
      clientPhone: data.patientPhone,
      clientName: data.patientName,
      appointmentTime: slot.startTime.toISOString(),
      serviceName: "Service Name", // Get from service repo
      serviceId: data.serviceId,
    });

    return request;
  }

  async approveReservation(
    requestId: string,
    approvedBy: string,
    changes?: any,
  ) {
    const request = await this.reservationRequestRepo.findById(requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or not pending");
    }

    // Apply any changes requested by doctor
    if (changes) {
      await this.applyReservationChanges(request, changes);
    }

    // Update request status
    const approved = await this.reservationRequestRepo.updateStatus(
      requestId,
      "approved",
      approvedBy,
    );

    // Update slot to reserved
    await this.timeSlotRepo.updateStatus(request.slotId, "reserved");
    await this.timeSlotRepo.incrementReservations(request.slotId);

    // Send approval notification
    await this.sendApprovalNotification(approved);

    // Trigger Inngest workflow for confirmation
    await this.inngestEventService.sendReservationApproved({
      reservationId: requestId,
      profileId: request.profileId,
      approvedBy,
      changes,
    });

    return approved;
  }

  async rejectReservation(requestId: string, reason: string) {
    const request = await this.reservationRequestRepo.findById(requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or not pending");
    }

    // Update request status
    const rejected = await this.reservationRequestRepo.updateStatus(
      requestId,
      "rejected",
      undefined,
      reason,
    );

    // Release the slot
    await this.timeSlotRepo.updateStatus(request.slotId, "available");

    // Send rejection notification
    await this.sendRejectionNotification(rejected, reason);

    // Trigger Inngest workflow
    await this.inngestEventService.sendReservationRejected({
      reservationId: requestId,
      profileId: request.profileId,
      reason,
    });

    return rejected;
  }

  async getPendingRequestsForDoctor(profileId: string) {
    return await this.reservationRequestRepo.findPendingByProfileId(profileId);
  }

  async getPendingRequestsCount(profileId: string) {
    return await this.reservationRequestRepo.countPendingByProfileId(profileId);
  }

  private async notifyDoctorOfNewRequest(request: ReservationRequest) {
    // Send WhatsApp notification to doctor
    const message = `Nueva solicitud de cita de ${request.patientName}. Motivo: ${request.chiefComplaint || "Consulta general"}. Tel: ${request.patientPhone}`;

    // Get doctor's phone from profile
    // await this.whatsappService.sendMessage(doctorPhone, message);

    console.log(`[ReservationService] Doctor notification: ${message}`);
  }

  private async sendApprovalNotification(request: ReservationRequest) {
    // Send WhatsApp confirmation to patient
    const message = `Hola ${request.patientName}, tu solicitud de cita ha sido aprobada. Te contactaremos pronto para confirmar los detalles.`;

    // await this.whatsappService.sendMessage(request.patientPhone, message);

    console.log(`[ReservationService] Approval notification: ${message}`);
  }

  private async sendRejectionNotification(
    request: ReservationRequest,
    reason: string,
  ) {
    // Send WhatsApp rejection to patient
    const message = `Hola ${request.patientName}, lamentablemente no podemos atender tu solicitud en este momento. ${reason ? "Razón: " + reason : ""}`;

    // await this.whatsappService.sendMessage(request.patientPhone, message);

    console.log(`[ReservationService] Rejection notification: ${message}`);
  }

  private async applyReservationChanges(
    request: ReservationRequest,
    changes: any,
  ) {
    // Implementation for applying doctor-requested changes
    // This could include changing time slot, service, duration, etc.
    console.log(
      `[ReservationService] Applying changes to request ${request.id}:`,
      changes,
    );
  }
}
```

## Migration from BullMQ to Inngest

### Remove BullMQ Campaign Queue

```typescript
// packages/api/src/services/business/campaign-queue-service.ts - DELETE THIS FILE
```

### Create Inngest Workflow Functions

```typescript
// packages/api/src/services/ingest/workflows/reservation-workflows.ts
import { inngest } from "../../lib/inngest";
import { MedicalEvents } from "../../lib/inngest";

export const reservationCreatedWorkflow = inngest.createFunction(
  {
    id: "reservation-created",
    name: "Reservation Created Workflow",
  },
  { event: "reservation/created" },
  async ({ event, step }) => {
    const { reservationId, clientPhone, appointmentTime, serviceName } =
      event.data;

    // Step 1: Send immediate confirmation
    await step.run("send-confirmation", async () => {
      // Send WhatsApp confirmation
      return await sendWhatsAppConfirmation({
        to: clientPhone,
        template: "reservation_received",
        variables: { serviceName, appointmentTime },
      });
    });

    // Step 2: Schedule 24h reminder
    const reminder24hTime = new Date(
      new Date(appointmentTime).getTime() - 24 * 60 * 60 * 1000,
    );
    await step.sleepUntil("wait-24h", reminder24hTime);

    await step.run("send-24h-reminder", async () => {
      return await sendWhatsAppReminder({
        to: clientPhone,
        template: "appointment_reminder_24h",
        variables: { serviceName, appointmentTime },
      });
    });

    // Step 3: Schedule 2h reminder
    const reminder2hTime = new Date(
      new Date(appointmentTime).getTime() - 2 * 60 * 60 * 1000,
    );
    await step.sleepUntil("wait-2h", reminder2hTime);

    await step.run("send-2h-reminder", async () => {
      return await sendWhatsAppReminder({
        to: clientPhone,
        template: "appointment_reminder_2h",
        variables: { serviceName, appointmentTime },
      });
    });

    return {
      reservationId,
      confirmationSent: true,
      remindersScheduled: true,
    };
  },
);
```

## Service Registration Updates

### Update Services Plugin

```typescript
// packages/api/src/plugins/services.ts
import { MedicalServiceRepository } from "../services/repository/medical-service-repository";
import { TimeSlotRepository } from "../services/repository/time-slot-repository";
import { ReservationRequestRepository } from "../services/repository/reservation-request-repository";
import { MedicalService } from "../services/business/medical-service";
import { ReservationService } from "../services/business/reservation-service";
import { AvailabilityService } from "../services/business/availability-service";

export const servicesPlugin = new Elysia({
  name: "services",
})
  // Repository layer
  .decorate("medicalServiceRepository", new MedicalServiceRepository())
  .decorate("timeSlotRepository", new TimeSlotRepository())
  .decorate("reservationRequestRepository", new ReservationRequestRepository())

  // Business service layer
  .decorate("medicalService", new MedicalService())
  .decorate("reservationService", new ReservationService())
  .decorate("availabilityService", new AvailabilityService())

  // Inngest integration
  .decorate("inngestEventService", new InngestEventService());
```

## Next Steps

1. **Create repository implementations** for all new tables
2. **Implement business service logic** with proper validation
3. **Set up Inngest workflow functions** for automation
4. **Create API routes** for medical reservation system
5. **Test service layer** with unit tests
6. **Integrate with WhatsApp service** for notifications
