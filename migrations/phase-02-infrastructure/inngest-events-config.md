# Inngest Event Configuration

## Event Type Definitions

```typescript
// packages/api/src/types/inngest-events.ts
export interface MedicalReservationEvents {
  // Reservation lifecycle events
  "reservation/created": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      serviceId: string;
      serviceName: string;
      slotId: string;
      appointmentTime: string; // ISO string
      appointmentEndTime: string; // ISO string
      timezone: string;
      doctorName: string;
      doctorPhone: string;
      clinicName: string;
      clinicAddress: string;
      price: number;
      urgencyLevel: "low" | "normal" | "high" | "urgent";
      source: "whatsapp" | "web" | "phone";
    };
  };

  "reservation/request-created": {
    data: {
      requestId: string;
      profileId: string;
      slotId: string;
      serviceId: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      chiefComplaint?: string;
      symptoms?: string;
      medicalHistory?: string;
      currentMedications?: string;
      allergies?: string;
      urgencyLevel: "low" | "normal" | "high" | "urgent";
      requestedTime: string; // ISO string
      expiresAt: string; // ISO string
    };
  };

  "reservation/approved": {
    data: {
      reservationId: string;
      profileId: string;
      requestId: string;
      approvedBy: string;
      approvedAt: string; // ISO string
      changes?: {
        originalTime?: string;
        newTime?: string;
        originalService?: string;
        newService?: string;
        durationChange?: number;
        notes?: string;
        priceAdjustment?: number;
      };
    };
  };

  "reservation/rejected": {
    data: {
      reservationId: string;
      profileId: string;
      requestId: string;
      rejectionReason: string;
      rejectedBy: string;
      rejectedAt: string; // ISO string
    };
  };

  "reservation/cancelled": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string; // ISO string
      serviceName: string;
      cancellationReason?: string;
      cancelledBy: "patient" | "doctor" | "system";
      cancelledAt: string; // ISO string
      refundAmount?: number;
    };
  };

  "reservation/completed": {
    data: {
      reservationId: string;
      profileId: string;
      completedAt: string; // ISO string
      notes?: string;
      followUpRequired?: boolean;
      nextAppointmentDate?: string; // ISO string
      prescriptionIssued?: boolean;
    };
  };

  // Appointment reminder events
  "appointment/reminder-24h": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string; // ISO string
      serviceName: string;
      doctorName: string;
      clinicName: string;
      clinicAddress: string;
      preparationInstructions?: string;
    };
  };

  "appointment/reminder-2h": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string; // ISO string
      serviceName: string;
      clinicName: string;
      clinicAddress: string;
      parkingInfo?: string;
      buildingInfo?: string;
      floorInfo?: string;
      officeNumber?: string;
    };
  };

  "appointment/follow-up": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentDate: string; // ISO string
      followUpType: "24h" | "48h" | "1week" | "2weeks";
      followUpQuestions: string[];
    };
  };

  // Slot management events
  "slot/generate-daily": {
    data: {
      profileId: string;
      targetDate: string; // ISO date string
      timezone: string;
      generateForServices: string[]; // service IDs
    };
  };

  "slot/expired-cleanup": {
    data: {
      profileId: string;
      expiredSlotIds: string[];
      cleanupDate: string; // ISO date string
    };
  };

  // Availability management events
  "availability/changed": {
    data: {
      profileId: string;
      changedBy: string;
      changes: {
        dayOfWeek?: number;
        startTime?: string; // HH:MM format
        endTime?: string; // HH:MM format
        slotDuration?: number;
        bufferTime?: number;
      };
      effectiveDate: string; // ISO date string
    };
  };

  // Medical service events
  "medical-service/created": {
    data: {
      serviceId: string;
      profileId: string;
      name: string;
      duration: number;
      price: number;
      category: string;
      createdBy: string;
    };
  };

  "medical-service/updated": {
    data: {
      serviceId: string;
      profileId: string;
      changes: Partial<{
        name: string;
        description: string;
        duration: number;
        price: number;
        requirements: string;
      }>;
      updatedBy: string;
    };
  };

  // Doctor notification events
  "doctor/new-request": {
    data: {
      profileId: string;
      doctorName: string;
      doctorPhone: string;
      requestId: string;
      patientName: string;
      patientPhone: string;
      serviceName: string;
      appointmentTime: string; // ISO string
      urgencyLevel: string;
      chiefComplaint?: string;
    };
  };

  "doctor/request-expired": {
    data: {
      profileId: string;
      doctorName: string;
      requestId: string;
      patientName: string;
      expiredAt: string; // ISO string
    };
  };
}
```

## Inngest Client Configuration

```typescript
// packages/api/src/lib/inngest-client.ts
import { Inngest } from "inngest";
import type { MedicalReservationEvents } from "../types/inngest-events";

export const inngest = new Inngest({
  id: "medical-chatbot-platform",
  name: "Medical Chatbot Platform",
  eventKey: process.env.INNGEST_EVENT_KEY!,
  schemas: new Map<
    keyof MedicalReservationEvents,
    MedicalReservationEvents[keyof MedicalReservationEvents]
  >([
    [
      "reservation/created",
      {
        name: "reservation/created",
        data: {
          reservationId: { type: "string", required: true },
          profileId: { type: "string", required: true },
          patientName: { type: "string", required: true },
          patientPhone: { type: "string", required: true },
          serviceId: { type: "string", required: true },
          appointmentTime: {
            type: "string",
            format: "date-time",
            required: true,
          },
          timezone: { type: "string", required: true },
          doctorName: { type: "string", required: true },
          clinicName: { type: "string", required: true },
        },
      },
    ],
    // ... more event schemas
  ]),
  baseUrl: process.env.INNGEST_BASE_URL || "https://api.inngest.com",
});

// Helper functions for sending events
export const sendMedicalEvent = async <
  T extends keyof MedicalReservationEvents,
>(
  eventName: T,
  data: MedicalReservationEvents[T]["data"],
) => {
  return await inngest.send({
    name: eventName,
    data,
  });
};
```

## Environment Configuration

```bash
# .env.local
INNGEST_EVENT_KEY=your-production-event-key
INNGEST_SIGNING_KEY=your-signing-key-for-webhooks
INNGEST_APP_ID=medical-chatbot-platform
INNGEST_BASE_URL=https://api.inngest.com
INNGEST_DEV_SERVER_URL=http://localhost:8288
```

## Development Setup

```typescript
// packages/api/src/lib/inngest-dev.ts
export const setupInngestDev = () => {
  if (process.env.NODE_ENV === "development") {
    return new Inngest({
      id: "medical-chatbot-dev",
      name: "Medical Chatbot (Dev)",
      eventKey: "local-dev-key",
      baseUrl: process.env.INNGEST_DEV_SERVER_URL || "http://localhost:8288",
    });
  }

  return new Inngest({
    id: process.env.INNGEST_APP_ID || "medical-chatbot-platform",
    name: "Medical Chatbot Platform",
    eventKey: process.env.INNGEST_EVENT_KEY!,
    baseUrl: process.env.INNGEST_BASE_URL!,
  });
};
```

## Next Steps

1. **Implement workflow functions** for each event type
2. **Create API endpoints** to trigger events
3. **Set up webhook handlers** for Inngest
4. **Configure monitoring** and observability
5. **Test workflow orchestration** end-to-end
