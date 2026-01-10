# Inngest Configuration Setup

## 1. Installation and Dependencies

### Remove BullMQ Dependencies

```bash
# Remove BullMQ packages
bun remove bullmq
bun remove @types/bullmq
bun remove ioredis

# Install Inngest
bun add inngest
```

### Update package.json

```json
{
  "dependencies": {
    "inngest": "^3.0.0"
    // Remove: "bullmq": "^4.0.0",
    // Remove: "ioredis": "^5.0.0"
  }
}
```

## 2. Inngest Client Configuration

### Create Inngest Client

```typescript
// packages/api/src/lib/inngest.ts
import { Inngest } from "inngest";

// Create Inngest client instance
export const inngest = new Inngest({
  id: "medical-chatbot-platform",
  name: "Medical Chatbot Platform",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-dev-key",
});

// Event type definitions
export type MedicalEvents = {
  "reservation/created": {
    data: {
      reservationId: string;
      profileId: string;
      clientPhone: string;
      clientName: string;
      appointmentTime: string;
      serviceName: string;
      serviceId: string;
    };
  };
  "reservation/cancelled": {
    data: {
      reservationId: string;
      clientPhone: string;
      appointmentTime: string;
      serviceName: string;
      reason?: string;
    };
  };
  "reservation/approved": {
    data: {
      reservationId: string;
      profileId: string;
      approvedBy: string;
      changes?: {
        time?: string;
        service?: string;
        duration?: number;
        notes?: string;
      };
    };
  };
  "reservation/rejected": {
    data: {
      reservationId: string;
      profileId: string;
      reason: string;
    };
  };
  "schedule/daily-slot-generation": {
    data: {
      profileId: string;
      targetDate: string;
      timezone: string;
    };
  };
  "appointment/reminder-24h": {
    data: {
      reservationId: string;
      clientPhone: string;
      appointmentTime: string;
      serviceName: string;
      doctorName: string;
    };
  };
  "appointment/reminder-2h": {
    data: {
      reservationId: string;
      clientPhone: string;
      appointmentTime: string;
      serviceName: string;
      location: string;
    };
  };
};
```

## 3. Environment Configuration

### Add Inngest Environment Variables

```bash
# .env.local
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_APP_ID=medical-chatbot-platform
INNGEST_BASE_URL=https://api.inngest.com
```

### Update Environment Types

```typescript
// packages/api/src/env.ts
export const env = createEnv({
  server: {
    // Remove BullMQ Redis config
    // REDIS_URL: z.string().url(),
    // REDIS_PORT: z.string().transform(Number),

    // Add Inngest config
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
    INNGEST_APP_ID: z.string().default("medical-chatbot-platform"),
    INNGEST_BASE_URL: z.string().url().default("https://api.inngest.com"),
  },
  client: {
    // Remove Redis client config
  },
  runtimeEnv: {
    // Remove Redis env vars
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_APP_ID: process.env.INNGEST_APP_ID,
    INNGEST_BASE_URL: process.env.INNGEST_BASE_URL,
  },
});
```

## 4. Service Registration Updates

### Update Service Plugin

```typescript
// packages/api/src/plugins/services.ts
import { InngestEventService } from "../services/ingest/inngest-event-service";
import { ReservationService } from "../services/business/reservation-service";
import { AvailabilityService } from "../services/business/availability-service";
import { MedicalService } from "../services/business/medical-service";

export const servicesPlugin = new Elysia({
  name: "services",
})
  // Remove BullMQ services
  // .decorate("campaignQueueService", new CampaignQueueService())

  // Add Inngest services
  .decorate("inngestEventService", new InngestEventService())
  .decorate("reservationService", new ReservationService())
  .decorate("availabilityService", new AvailabilityService())
  .decorate("medicalService", new MedicalService());
```

## 5. Inngest Event Service

### Create Event Service

```typescript
// packages/api/src/services/ingest/inngest-event-service.ts
import { inngest } from "../../lib/inngest";
import type { MedicalEvents } from "../../lib/inngest";

export class InngestEventService {
  async sendReservationCreated(
    data: MedicalEvents["reservation/created"]["data"],
  ) {
    await inngest.send({
      name: "reservation/created",
      data,
    });
  }

  async sendReservationCancelled(
    data: MedicalEvents["reservation/cancelled"]["data"],
  ) {
    await inngest.send({
      name: "reservation/cancelled",
      data,
    });
  }

  async sendReservationApproved(
    data: MedicalEvents["reservation/approved"]["data"],
  ) {
    await inngest.send({
      name: "reservation/approved",
      data,
    });
  }

  async sendReservationRejected(
    data: MedicalEvents["reservation/rejected"]["data"],
  ) {
    await inngest.send({
      name: "reservation/rejected",
      data,
    });
  }

  async scheduleDailySlotGeneration(profileId: string, targetDate: string) {
    await inngest.send({
      name: "schedule/daily-slot-generation",
      data: {
        profileId,
        targetDate,
        timezone: "America/Mexico_City", // Configurable per doctor
      },
    });
  }

  async sendReminder24h(
    data: MedicalEvents["appointment/reminder-24h"]["data"],
  ) {
    await inngest.send({
      name: "appointment/reminder-24h",
      data,
    });
  }

  async sendReminder2h(data: MedicalEvents["appointment/reminder-2h"]["data"]) {
    await inngest.send({
      name: "appointment/reminder-2h",
      data,
    });
  }
}
```

## 6. Middleware Configuration

### Create Inngest Middleware

```typescript
// packages/api/src/middleware/inngest-middleware.ts
import { inngest } from "../lib/inngest";

export const inngestMiddleware = async (request: Request) => {
  // Handle Inngest webhook verification
  const signature = request.headers.get("x-inngest-signature");
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  if (!signature || !signingKey) {
    throw new Error("Inngest signature verification failed");
  }

  // Verify signature (implementation depends on Inngest SDK)
  const isValid = await verifyInngestSignature(signature, signingKey);

  if (!isValid) {
    throw new Error("Invalid Inngest signature");
  }

  return true;
};
```

## 7. Development Setup

### Local Development Configuration

```typescript
// packages/api/src/lib/inngest-dev.ts
export const setupInngestDev = () => {
  if (process.env.NODE_ENV === "development") {
    // Use local Inngest dev server
    return new Inngest({
      id: "medical-chatbot-platform-dev",
      name: "Medical Chatbot Platform (Dev)",
      eventKey: "local-dev-key",
      baseUrl: "http://localhost:8288", // Local dev server
    });
  }

  return new Inngest({
    id: process.env.INNGEST_APP_ID || "medical-chatbot-platform",
    name: "Medical Chatbot Platform",
    eventKey: process.env.INNGEST_EVENT_KEY,
    baseUrl: process.env.INNGEST_BASE_URL,
  });
};
```

## 8. Monitoring and Observability

### Add Inngest Monitoring

```typescript
// packages/api/src/lib/inngest-telemetry.ts
import { trace } from "@opentelemetry/api";

export const withInngestTelemetry = (fn: Function) => {
  return async (...args: any[]) => {
    const span = trace
      .getTracer("medical-chatbot")
      .startSpan("inngest-function");

    try {
      const result = await fn(...args);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  };
};
```

## 9. Migration from BullMQ

### Remove BullMQ Queue Services

```typescript
// Remove from: packages/api/src/services/business/campaign-queue-service.ts
// Delete entire file or comment out

// Remove from: packages/api/src/services/business/campaign-processor.ts
// Delete entire file or comment out

// Remove from: packages/api/src/lib/redis.ts
// Delete entire file or comment out
```

### Update Campaign Service to Use Inngest

```typescript
// packages/api/src/services/business/campaign-service.ts
export class CampaignService {
  constructor(
    private inngestEventService: InngestEventService,
    // Remove: private campaignQueueService: CampaignQueueService
  ) {}

  async scheduleCampaign(campaignId: string, scheduledAt: Date) {
    // Instead of BullMQ queue, use Inngest
    await this.inngestEventService.scheduleCampaign({
      campaignId,
      scheduledAt: scheduledAt.toISOString(),
      timezone: "America/Mexico_City",
    });
  }
}
```

## 10. Configuration Validation

### Validate Inngest Setup

```typescript
// packages/api/src/lib/validate-inngest.ts
export const validateInngestConfig = () => {
  const required = [
    "INNGEST_EVENT_KEY",
    "INNGEST_SIGNING_KEY",
    "INNGEST_APP_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Inngest configuration: ${missing.join(", ")}`);
  }

  console.log("✅ Inngest configuration validated");
};
```

## Next Steps

1. **Run database migrations** for new tables
2. **Deploy Inngest functions** to production
3. **Test workflow orchestration** with medical reservation system
4. **Set up monitoring** and alerting
5. **Configure production environment** variables
