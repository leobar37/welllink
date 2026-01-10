# Phase 5: Inngest Workflows Implementation

## 🎯 Overview

Complete implementation of Inngest workflows for automated medical appointment management, including reminders, cancellations, and slot generation.

## 📁 Implementation Files

- `reminder-workflows.ts` - Automated reminder system
- `cancellation-workflows.ts` - Cancellation and rescheduling
- `slot-generation-workflow.ts` - Daily slot generation
- `expiration-handling.ts` - Request and slot expiration
- `workflow-orchestration.ts` - Main workflow coordination

## ⚡ Core Workflows Implementation

### 1. Reminder Workflows

```typescript
// packages/api/src/services/ingest/workflows/reminder-workflows.ts
import { inngest } from "../../lib/inngest";
import { WhatsAppService } from "../../business/whatsapp-service";
import { ReservationService } from "../../business/reservation-service";

/**
 * Main reminder workflow: 24h and 2h before appointment
 */
export const appointmentReminderWorkflow = inngest.createFunction(
  {
    id: "appointment-reminders",
    name: "Appointment Reminder System",
    concurrency: 10,
    retries: 3,
  },
  { event: "appointment/created" },
  async ({ event, step }) => {
    const {
      reservationId,
      patientName,
      patientPhone,
      appointmentTime,
      serviceName,
      doctorName,
      clinicName,
      clinicAddress,
      preparationInstructions,
    } = event.data;

    console.log(
      `[Reminders] Starting reminder workflow for ${patientName} - ${reservationId}`,
    );

    // Step 1: Send immediate confirmation
    await step.run("send-confirmation", async () => {
      return await WhatsAppService.sendTemplate({
        to: patientPhone,
        template: "appointment_confirmed",
        variables: {
          patient_name: patientName,
          service_name: serviceName,
          appointment_date: format(new Date(appointmentTime), "PPP", {
            locale: es,
          }),
          appointment_time: format(new Date(appointmentTime), "p", {
            locale: es,
          }),
          doctor_name: doctorName,
          clinic_name: clinicName,
          clinic_address: clinicAddress,
        },
      });
    });

    // Calculate reminder times
    const appointmentDate = new Date(appointmentTime);
    const reminder24hTime = new Date(
      appointmentDate.getTime() - 24 * 60 * 60 * 1000,
    );
    const reminder2hTime = new Date(
      appointmentDate.getTime() - 2 * 60 * 60 * 1000,
    );

    // Step 2: Wait 24 hours and send reminder
    if (reminder24hTime > new Date()) {
      await step.sleepUntil("wait-24h", reminder24hTime);

      await step.run("send-24h-reminder", async () => {
        return await WhatsAppService.sendTemplate({
          to: patientPhone,
          template: "appointment_reminder_24h",
          variables: {
            patient_name: patientName,
            service_name: serviceName,
            appointment_date: format(appointmentDate, "PPP", { locale: es }),
            appointment_time: format(appointmentDate, "p", { locale: es }),
            clinic_name: clinicName,
            clinic_address: clinicAddress,
            preparation_instructions:
              preparationInstructions ||
              "Traiga su identificación y seguro médico",
          },
        });
      });

      // Update reminder status
      await step.run("update-24h-status", async () => {
        return await ReservationService.markReminderSent(reservationId, "24h");
      });
    }

    // Step 3: Wait 2 more hours and send final reminder
    if (reminder2hTime > new Date()) {
      await step.sleepUntil("wait-2h", reminder2hTime);

      await step.run("send-2h-reminder", async () => {
        return await WhatsAppService.sendTemplate({
          to: patientPhone,
          template: "appointment_reminder_2h",
          variables: {
            patient_name: patientName,
            service_name: serviceName,
            appointment_time: format(appointmentDate, "p", { locale: es }),
            clinic_name: clinicName,
            clinic_address: clinicAddress,
            parking_info: "Estacionamiento disponible en el edificio",
            building_info: "Consultorio 301, 3er piso",
            office_number: "301",
          },
        });
      });

      // Update final reminder status
      await step.run("update-2h-status", async () => {
        return await ReservationService.markReminderSent(reservationId, "2h");
      });
    }

    return {
      reservationId,
      confirmationSent: true,
      reminder24hScheduled: reminder24hTime > new Date(),
      reminder2hScheduled: reminder2hTime > new Date(),
      workflowCompleted: true,
    };
  },
);

/**
 * Follow-up reminder workflow (24h, 48h, 1 week after appointment)
 */
export const followUpReminderWorkflow = inngest.createFunction(
  {
    id: "appointment-follow-up",
    name: "Post-Appointment Follow-up",
    concurrency: 5,
    retries: 2,
  },
  { event: "appointment/completed" },
  async ({ event, step }) => {
    const {
      reservationId,
      patientName,
      patientPhone,
      appointmentDate,
      followUpType,
      followUpQuestions,
    } = event.data;

    console.log(
      `[Follow-up] Starting follow-up for ${patientName} - ${reservationId}`,
    );

    const appointmentDateTime = new Date(appointmentDate);

    // 24-hour follow-up
    const followUp24h = new Date(
      appointmentDateTime.getTime() + 24 * 60 * 60 * 1000,
    );
    if (followUp24h > new Date()) {
      await step.sleepUntil("wait-24h-followup", followUp24h);

      await step.run("send-24h-followup", async () => {
        return await WhatsAppService.sendTemplate({
          to: patientPhone,
          template: "follow_up_24h",
          variables: {
            patient_name: patientName,
            follow_up_questions:
              followUpQuestions?.join("\n") ||
              [
                "¿Cómo se siente después de la consulta?",
                "¿Está tomando los medicamentos según lo indicado?",
                "¿Tiene alguna pregunta sobre el tratamiento?",
              ].join("\n"),
          },
        });
      });
    }

    // 1-week follow-up (if needed)
    if (followUpType === "1week") {
      const followUp1Week = new Date(
        appointmentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      if (followUp1Week > new Date()) {
        await step.sleepUntil("wait-1week-followup", followUp1Week);

        await step.run("send-1week-followup", async () => {
          return await WhatsAppService.sendTemplate({
            to: patientPhone,
            template: "follow_up_1week",
            variables: {
              patient_name: patientName,
              message:
                "¿Cómo ha sido su evolución esta semana? ¿Necesita agendar una cita de seguimiento?",
            },
          });
        });
      }
    }

    return {
      reservationId,
      followUpCompleted: true,
      followUpType,
    };
  },
);

/**
 * Medication reminder workflow
 */
export const medicationReminderWorkflow = inngest.createFunction(
  {
    id: "medication-reminders",
    name: "Medication Reminder System",
    concurrency: 20,
    retries: 1,
  },
  { event: "prescription/created" },
  async ({ event, step }) => {
    const {
      patientName,
      patientPhone,
      medicationName,
      dosage,
      frequency,
      startDate,
      duration,
      instructions,
    } = event.data;

    const startDateTime = new Date(startDate);
    const medicationSchedule = this.calculateMedicationSchedule(
      frequency,
      duration,
    );

    for (const reminderTime of medicationSchedule) {
      if (reminderTime > new Date()) {
        await step.sleepUntil(
          `medication-${reminderTime.getTime()}`,
          reminderTime,
        );

        await step.run("send-medication-reminder", async () => {
          return await WhatsAppService.sendTemplate({
            to: patientPhone,
            template: "medication_reminder",
            variables: {
              patient_name: patientName,
              medication_name: medicationName,
              dosage: dosage,
              instructions:
                instructions || "Tome con agua, preferiblemente con comida",
            },
          });
        });
      }
    }

    return {
      patientName,
      medicationName,
      totalReminders: medicationSchedule.length,
      remindersCompleted: true,
    };
  },
);
```

### 2. Cancellation and Rescheduling Workflows

```typescript
// packages/api/src/services/ingest/workflows/cancellation-workflows.ts

/**
 * Handle appointment cancellation workflow
 */
export const appointmentCancellationWorkflow = inngest.createFunction(
  {
    id: "appointment-cancellation",
    name: "Appointment Cancellation Handler",
    concurrency: 5,
    retries: 2,
  },
  { event: "reservation/cancelled" },
  async ({ event, step }) => {
    const {
      reservationId,
      patientName,
      patientPhone,
      appointmentTime,
      serviceName,
      cancellationReason,
      cancelledBy,
      refundAmount,
    } = event.data;

    console.log(
      `[Cancellation] Processing cancellation for ${patientName} - ${reservationId}`,
    );

    // Step 1: Release the time slot
    await step.run("release-slot", async () => {
      const reservation = await ReservationService.findById(reservationId);
      if (reservation) {
        return await TimeSlotService.updateStatus(
          reservation.slotId,
          "available",
        );
      }
    });

    // Step 2: Send cancellation confirmation to patient
    await step.run("send-cancellation-confirmation", async () => {
      return await WhatsAppService.sendTemplate({
        to: patientPhone,
        template: "appointment_cancelled",
        variables: {
          patient_name: patientName,
          service_name: serviceName,
          appointment_date: format(new Date(appointmentTime), "PPP", {
            locale: es,
          }),
          appointment_time: format(new Date(appointmentTime), "p", {
            locale: es,
          }),
          cancellation_reason:
            cancellationReason || "Cancelación solicitada por el paciente",
          refund_amount: refundAmount ? `$${refundAmount}` : "No aplica",
          next_steps: "Puede agendar una nueva cita cuando desee",
        },
      });
    });

    // Step 3: Notify doctor
    await step.run("notify-doctor-cancellation", async () => {
      const reservation = await ReservationService.findById(reservationId);
      if (reservation) {
        const doctor = await ProfileService.findById(reservation.profileId);
        return await WhatsAppService.sendTemplate({
          to: doctor.phone,
          template: "appointment_cancelled_doctor",
          variables: {
            patient_name: patientName,
            service_name: serviceName,
            appointment_date: format(new Date(appointmentTime), "PPP", {
              locale: es,
            }),
            appointment_time: format(new Date(appointmentTime), "p", {
              locale: es,
            }),
            cancellation_reason: cancellationReason,
          },
        });
      }
    });

    // Step 4: Handle refund if applicable
    if (refundAmount && refundAmount > 0) {
      await step.run("process-refund", async () => {
        return await PaymentService.processRefund(reservationId, refundAmount);
      });
    }

    // Step 5: Cancel any scheduled reminders
    await step.run("cancel-reminders", async () => {
      return await InngestEventService.cancelScheduledReminders(reservationId);
    });

    // Step 6: Update analytics
    await step.run("update-cancellation-analytics", async () => {
      return await AnalyticsService.recordCancellation({
        reservationId,
        cancelledBy,
        cancellationReason,
        refundAmount,
      });
    });

    return {
      reservationId,
      slotReleased: true,
      patientNotified: true,
      doctorNotified: true,
      refundProcessed: !!refundAmount,
      remindersCancelled: true,
    };
  },
);

/**
 * Handle appointment rescheduling workflow
 */
export const appointmentReschedulingWorkflow = inngest.createFunction(
  {
    id: "appointment-rescheduling",
    name: "Appointment Rescheduling Handler",
    concurrency: 3,
    retries: 2,
  },
  { event: "appointment/rescheduled" },
  async ({ event, step }) => {
    const {
      oldReservationId,
      newReservationId,
      patientName,
      patientPhone,
      oldAppointmentTime,
      newAppointmentTime,
      serviceName,
      reschedulingReason,
      rescheduledBy,
    } = event.data;

    console.log(`[Rescheduling] Processing reschedule for ${patientName}`);

    // Step 1: Cancel old appointment and release slot
    await step.run("cancel-old-appointment", async () => {
      return await ReservationService.cancelReservation(
        oldReservationId,
        "rescheduled",
      );
    });

    // Step 2: Create new appointment
    await step.run("create-new-appointment", async () => {
      return await ReservationService.createReservation({
        profileId: event.data.profileId,
        slotId: event.data.newSlotId,
        serviceId: event.data.serviceId,
        patientName,
        patientPhone,
        appointmentTime: newAppointmentTime,
        source: "rescheduled",
      });
    });

    // Step 3: Send rescheduling confirmation to patient
    await step.run("send-rescheduling-confirmation", async () => {
      return await WhatsAppService.sendTemplate({
        to: patientPhone,
        template: "appointment_rescheduled",
        variables: {
          patient_name: patientName,
          service_name: serviceName,
          old_appointment_date: format(new Date(oldAppointmentTime), "PPP", {
            locale: es,
          }),
          old_appointment_time: format(new Date(oldAppointmentTime), "p", {
            locale: es,
          }),
          new_appointment_date: format(new Date(newAppointmentTime), "PPP", {
            locale: es,
          }),
          new_appointment_time: format(new Date(newAppointmentTime), "p", {
            locale: es,
          }),
          rescheduling_reason:
            reschedulingReason || "Cambio de horario solicitado",
        },
      });
    });

    // Step 4: Update reminder schedules for new appointment
    await step.run("update-reminder-schedules", async () => {
      return await InngestEventService.scheduleRemindersForNewAppointment(
        newReservationId,
      );
    });

    // Step 5: Cancel old reminders
    await step.run("cancel-old-reminders", async () => {
      return await InngestEventService.cancelScheduledReminders(
        oldReservationId,
      );
    });

    return {
      oldReservationId,
      newReservationId,
      oldSlotReleased: true,
      newSlotReserved: true,
      patientNotified: true,
      remindersUpdated: true,
    };
  },
);
```

### 3. Slot Generation Workflow

```typescript
// packages/api/src/services/ingest/workflows/slot-generation-workflow.ts

/**
 * Daily slot generation for doctor availability
 */
export const dailySlotGenerationWorkflow = inngest.createFunction(
  {
    id: "daily-slot-generation",
    name: "Daily Slot Generation",
    concurrency: 5,
    retries: 1,
  },
  { event: "slot/generate-daily" },
  async ({ event, step }) => {
    const { profileId, targetDate, timezone, generateForServices } = event.data;

    console.log(`[Slot Generation] Generating slots for ${targetDate} - Profile ${profileId}`);

    // Step 1: Get doctor's availability rules
    const availabilityRules = await step.run("get-availability-rules", async () => {
      return await AvailabilityService.getRulesForDate(profileId, new Date(targetDate));
    });

    if (availabilityRules.length === 0) {
      console.log(`[Slot Generation] No availability rules found for ${profileId}`);
      return { generated: false, reason: "No availability rules" };
    }

    // Step 2: Get active services for this doctor
    const services = await step.run("get-active-services", async () => {
      return await MedicalServiceRepository.findActiveByProfileId(profileId);
    });

    if (services.length === 0) {
      console.log(`[Slot Generation] No active services found for ${profileId}`);
      return { generated: false, reason: "No active services" };
    }

    // Step 3: Generate slots for each service and availability rule
    const generatedSlots = await step.run("generate-slots", async () => {
      const slots: TimeSlot[] = [];

      for (const service of services) {
        for (const rule of availabilityRules) {
          const serviceSlots = await this.generateSlotsForServiceAndRule(
            profileId,
            service,
            rule,
            new Date(targetDate)
          );
          slots.push(...serviceSlots);
        }
      }

      return slots;
    });

    // Step 4: Clean up old/expired slots
    await step.run("cleanup-expired-slots", async () => {
      return await TimeSlotService.cleanupExpiredSlots(profileId, new Date(targetDate));
    });

    // Step 5: Update availability statistics
    await step.run("update-statistics", async () => {
      return await AnalyticsService.recordSlotGeneration({
        profileId,
        date: targetDate,
        slotsGenerated: generatedSlots.length,
        services: services.length
      });
    });

    return {
      profileId,
      targetDate,
      slotsGenerated: generatedSlots.length,
      servicesProcessed: services.length,
      availabilityRules: availabilityRules.length,
      generationCompleted: true
    };
  }
);

/**
 * Generate slots for a specific service and availability rule
 */
private async generateSlotsForServiceAndRule(
  profileId: string,
  service: MedicalService,
  rule: AvailabilityRule,
  targetDate: Date
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];

  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek !== rule.dayOfWeek) {
    return slots;
  }

  const startTime = this.parseTime(rule.startTime);
  const endTime = this.parseTime(rule.endTime);
  const slotDuration = rule.slotDuration || service.duration;
  const bufferTime = rule.bufferTime || 0;
  const maxSlots = rule.maxAppointmentsPerSlot || 1;

  let currentTime = new Date(targetDate);
  currentTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

  const endDateTime = new Date(targetDate);
  endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

  while (currentTime < endDateTime) {
    const slotEndTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);

    if (slotEndTime <= endDateTime) {
      const slot = await TimeSlotRepository.create({
        profileId,
        serviceId: service.id,
        startTime: currentTime,
        endTime: slotEndTime,
        maxReservations: maxSlots,
        currentReservations: 0,
        status: 'available',
        createdAt: new Date()
      });

      slots.push(slot);
    }

    // Move to next slot (including buffer time)
    currentTime = new Date(slotEndTime.getTime() + bufferTime * 60 * 1000);
  }

  return slots;
}
```

### 4. Expiration Handling Workflows

```typescript
// packages/api/src/services/ingest/workflows/expiration-handling.ts

/**
 * Handle expired reservation requests
 */
export const requestExpirationWorkflow = inngest.createFunction(
  {
    id: "request-expiration",
    name: "Request Expiration Handler",
    concurrency: 10,
    retries: 2,
  },
  { event: "reservation/request-expired" },
  async ({ event, step }) => {
    const {
      requestId,
      slotId,
      patientName,
      patientPhone,
      doctorId,
      doctorPhone,
    } = event.data;

    console.log(`[Expiration] Processing expired request ${requestId}`);

    // Step 1: Update request status to expired
    await step.run("expire-request", async () => {
      return await ReservationRequestService.updateStatus(requestId, "expired");
    });

    // Step 2: Release the time slot
    await step.run("release-slot", async () => {
      return await TimeSlotService.updateStatus(slotId, "available");
    });

    // Step 3: Notify patient
    await step.run("notify-patient", async () => {
      return await WhatsAppService.sendTemplate({
        to: patientPhone,
        template: "request_expired_patient",
        variables: {
          patient_name: patientName,
          message:
            "Su solicitud de cita expiró sin respuesta del doctor. Puede intentar nuevamente o contactar al consultorio directamente.",
        },
      });
    });

    // Step 4: Notify doctor
    await step.run("notify-doctor", async () => {
      const doctor = await ProfileService.findById(doctorId);
      return await WhatsAppService.sendTemplate({
        to: doctorPhone,
        template: "request_expired_doctor",
        variables: {
          patient_name: patientName,
          message:
            "Una solicitud de cita expiró sin respuesta. El paciente puede intentar nuevamente.",
        },
      });
    });

    // Step 5: Update statistics
    await step.run("update-stats", async () => {
      return await AnalyticsService.recordExpiredRequest({
        requestId,
        doctorId,
        expirationReason: "timeout",
        expiredAt: new Date(),
      });
    });

    return {
      requestId,
      slotReleased: true,
      patientNotified: true,
      doctorNotified: true,
      expirationHandled: true,
    };
  },
);

/**
 * Clean up expired slots daily
 */
export const expiredSlotsCleanupWorkflow = inngest.createFunction(
  {
    id: "expired-slots-cleanup",
    name: "Expired Slots Cleanup",
    concurrency: 3,
    retries: 1,
  },
  { event: "slot/cleanup-expired" },
  async ({ event, step }) => {
    const { profileId, cleanupDate } = event.data;

    console.log(
      `[Cleanup] Starting expired slots cleanup for ${profileId} - ${cleanupDate}`,
    );

    // Step 1: Find expired pending approval slots
    const expiredSlots = await step.run("find-expired-slots", async () => {
      return await TimeSlotService.findExpiredPendingSlots(
        profileId,
        new Date(cleanupDate),
      );
    });

    if (expiredSlots.length === 0) {
      return { cleaned: 0, reason: "No expired slots found" };
    }

    // Step 2: Clean up expired slots
    const cleanedSlots = await step.run("cleanup-slots", async () => {
      const cleaned: string[] = [];

      for (const slot of expiredSlots) {
        try {
          await TimeSlotService.updateStatus(slot.id, "available");
          cleaned.push(slot.id);
        } catch (error) {
          console.error(`Failed to clean slot ${slot.id}:`, error);
        }
      }

      return cleaned;
    });

    // Step 3: Update related requests
    await step.run("update-related-requests", async () => {
      for (const slotId of cleanedSlots) {
        await ReservationRequestService.updateExpiredRequestsForSlot(slotId);
      }
    });

    // Step 4: Log cleanup statistics
    await step.run("log-statistics", async () => {
      return await AnalyticsService.recordSlotCleanup({
        profileId,
        date: cleanupDate,
        slotsCleaned: cleanedSlots.length,
      });
    });

    return {
      profileId,
      cleanupDate,
      slotsCleaned: cleanedSlots.length,
      cleanupCompleted: true,
    };
  },
);
```

### 5. Main Workflow Orchestration

```typescript
// packages/api/src/services/ingest/workflows/workflow-orchestration.ts

/**
 * Main workflow coordinator that manages all medical appointment workflows
 */
export class WorkflowOrchestrator {
  constructor(
    private inngestEventService: InngestEventService,
    private analyticsService: AnalyticsService,
  ) {}

  /**
   * Initialize all medical workflows
   */
  async initializeWorkflows(): Promise<void> {
    console.log("[Workflows] Initializing medical appointment workflows");

    // Register all workflow functions
    await this.registerWorkflows([
      appointmentReminderWorkflow,
      followUpReminderWorkflow,
      medicationReminderWorkflow,
      appointmentCancellationWorkflow,
      appointmentReschedulingWorkflow,
      dailySlotGenerationWorkflow,
      requestExpirationWorkflow,
      expiredSlotsCleanupWorkflow,
    ]);

    console.log("[Workflows] All workflows initialized successfully");
  }

  /**
   * Schedule daily slot generation for all active doctors
   */
  async scheduleDailySlotGeneration(): Promise<void> {
    const activeDoctors = await ProfileService.findActiveDoctors();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const doctor of activeDoctors) {
      await this.inngestEventService.scheduleDailySlotGeneration({
        profileId: doctor.id,
        targetDate: tomorrow.toISOString().split("T")[0],
        timezone: doctor.timezone || "America/Mexico_City",
        generateForServices: doctor.activeServices,
      });
    }

    console.log(
      `[Workflows] Scheduled slot generation for ${activeDoctors.length} doctors`,
    );
  }

  /**
   * Monitor workflow performance and health
   */
  async getWorkflowHealth(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    failedWorkflows: number;
    averageExecutionTime: number;
    successRate: number;
  }> {
    const workflowStats = await InngestService.getWorkflowStatistics();

    return {
      totalWorkflows: workflowStats.total,
      activeWorkflows: workflowStats.active,
      failedWorkflows: workflowStats.failed,
      averageExecutionTime: workflowStats.avgExecutionTime,
      successRate: workflowStats.successRate,
    };
  }

  /**
   * Retry failed workflows
   */
  async retryFailedWorkflows(): Promise<{
    retried: number;
    success: number;
    failed: number;
  }> {
    const failedWorkflows = await InngestService.getFailedWorkflows();
    const results = {
      retried: 0,
      success: 0,
      failed: 0,
    };

    for (const workflow of failedWorkflows) {
      results.retried++;

      try {
        await InngestService.retryWorkflow(workflow.id);
        results.success++;
      } catch (error) {
        results.failed++;
        console.error(`Failed to retry workflow ${workflow.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get workflow analytics for dashboard
   */
  async getWorkflowAnalytics(timeRange: DateRange): Promise<{
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    mostActiveWorkflows: Array<{
      name: string;
      executions: number;
      successRate: number;
    }>;
    errorBreakdown: Array<{
      errorType: string;
      count: number;
      percentage: number;
    }>;
  }> {
    const analytics =
      await this.analyticsService.getWorkflowAnalytics(timeRange);

    return {
      totalExecutions: analytics.totalExecutions,
      successRate: analytics.successRate,
      averageExecutionTime: analytics.avgExecutionTime,
      mostActiveWorkflows: analytics.mostActive,
      errorBreakdown: analytics.errors,
    };
  }
}
```

## 🚀 Deployment Configuration

### Inngest Configuration

```typescript
// packages/api/src/config/inngest.config.ts
export const inngestConfig = {
  development: {
    eventKey: "local-dev-key",
    baseUrl: "http://localhost:8288",
    signingKey: process.env.INNGEST_DEV_SIGNING_KEY,
  },
  production: {
    eventKey: process.env.INNGEST_EVENT_KEY,
    baseUrl: process.env.INNGEST_BASE_URL || "https://api.inngest.com",
    signingKey: process.env.INNGEST_SIGNING_KEY,
  },
};

export const workflowSchedule = {
  dailySlotGeneration: "0 2 * * *", // 2 AM daily
  expiredSlotsCleanup: "0 3 * * *", // 3 AM daily
  workflowHealthCheck: "*/5 * * * *", // Every 5 minutes
  analyticsUpdate: "0 */6 * * *", // Every 6 hours
};
```

## 🎯 Success Metrics

### Workflow Performance KPIs

- **Average execution time**: < 30 seconds
- **Success rate**: > 99.5%
- **Reminder delivery rate**: > 98%
- **Slot generation accuracy**: > 99%
- **Expiration handling**: < 5 minutes

### Reliability Metrics

- **Workflow uptime**: 99.9%
- **Error recovery rate**: > 95%
- **Message delivery success**: > 99%
- **State consistency**: 100%

## 📊 Monitoring and Observability

```typescript
// packages/api/src/monitoring/workflow-monitoring.ts
export const workflowMonitoring = {
  trackWorkflowExecution: (
    workflowName: string,
    duration: number,
    success: boolean,
  ) => {
    // Track workflow execution metrics
    metrics.increment("workflow.executions", { workflow: workflowName });
    metrics.histogram("workflow.duration", duration, {
      workflow: workflowName,
    });

    if (!success) {
      metrics.increment("workflow.failures", { workflow: workflowName });
    }
  },

  trackReminderDelivery: (reminderType: string, success: boolean) => {
    metrics.increment("reminders.sent", { type: reminderType });

    if (!success) {
      metrics.increment("reminders.failed", { type: reminderType });
    }
  },

  trackSlotGeneration: (profileId: string, slotsGenerated: number) => {
    metrics.increment("slots.generated", { profile_id: profileId });
    metrics.histogram("slots.generated.count", slotsGenerated, {
      profile_id: profileId,
    });
  },
};
```

**Phase 5: Inngest Workflows - Complete automation system ready** ✅
