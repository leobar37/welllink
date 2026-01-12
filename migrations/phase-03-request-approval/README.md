# Phase 3: Request & Approval System

## 📋 Overview

This phase implements the complete request and approval workflow for medical appointments, where patients request appointments that doctors must approve before confirmation.

## 🎯 Objectives

- ✅ Implement slot state management (available → pending_approval → reserved)
- ✅ Create request → approval workflow
- ✅ Build doctor dashboard for pending requests
- ✅ Set up WhatsApp notifications for doctors
- ✅ Implement request expiration system (30-minute timeout)

## 🔄 Workflow Overview

```
Patient Request → Slot Blocked (pending_approval) → Doctor Review → Approve/Reject → Confirmation/Cancellation
```

### Detailed Flow:

1. **Patient requests appointment** → Slot status: `pending_approval` (30 min timeout)
2. **Doctor receives notification** → Via WhatsApp (Evolution API)
3. **Doctor reviews request** → In dashboard with patient info
4. **Doctor approves/rejects** → With optional notes
5. **Patient receives confirmation** → Via WhatsApp
6. **Slot becomes reserved** → Or returns to available

## 🏗️ Implementation Components

### 1. Slot State Management

```typescript
// Slot statuses: 'available' | 'pending_approval' | 'reserved' | 'expired' | 'blocked'

interface TimeSlot {
  id: string;
  profileId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  maxReservations: number;
  currentReservations: number;
  status: SlotStatus;
  expiresAt?: Date; // For pending_approval slots
}
```

### 2. Request Creation Process

```typescript
interface ReservationRequest {
  id: string;
  profileId: string;
  slotId: string;
  serviceId: string;

  // Patient Information
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;

  // Medical Information
  chiefComplaint: string; // Main medical concern
  symptoms?: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  urgencyLevel: "low" | "normal" | "high" | "urgent";

  // Request Status
  status: "pending" | "approved" | "rejected" | "expired";
  requestedTime: Date;
  expiresAt: Date; // Usually 30 minutes from creation

  // Approval Details
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}
```

### 3. Doctor Notification System

```typescript
// WhatsApp template for new request notification
const doctorNotificationTemplate = {
  name: "new_appointment_request",
  content: `🩺 *Nueva Solicitud de Cita*

Paciente: {patient_name}
Teléfono: {patient_phone}
Servicio: {service_name}
Fecha: {appointment_date}
Hora: {appointment_time}
Urgencia: {urgency_level}

Motivo: {chief_complaint}

Responde "APROBAR" o "RECHAZAR"`,
};
```

## 📁 Implementation Files

### Core System Files

- `README.md` - System overview and setup guide
- `slot-state-management.md` - Slot status transitions
- `request-workflow.md` - Complete request lifecycle
- `doctor-dashboard.md` - Doctor interface for approvals
- `notification-system.md` - Real-time notifications

### API Routes

- `request-routes.md` - API endpoints for requests
- `approval-routes.md` - Doctor approval endpoints
- `notification-routes.md` - Notification handling

### Business Logic

- `request-service.md` - Request creation and management
- `approval-service.md` - Doctor approval logic
- `notification-service.md` - WhatsApp/SMS notifications
- `expiration-service.md` - Request timeout handling

### Database Operations

- `request-queries.md` - Database queries for requests
- `slot-queries.md` - Slot state management queries
- `approval-queries.md` - Approval tracking queries

---

## 🚀 Detailed Implementation

### 1. Request Creation API

```typescript
// POST /api/reservations/request
export const createReservationRequest = async (req: Request) => {
  const {
    profileId,
    slotId,
    serviceId,
    patientName,
    patientPhone,
    patientEmail,
    chiefComplaint,
    symptoms,
    medicalHistory,
    urgencyLevel = "normal",
  } = req.body;

  // 1. Validate slot availability
  const slot = await timeSlotRepository.findById(slotId);
  if (!slot || slot.status !== "available") {
    throw new Error("Time slot not available");
  }

  // 2. Create reservation request
  const request = await reservationRequestRepository.create({
    profileId,
    slotId,
    serviceId,
    patientName,
    patientPhone,
    patientEmail,
    chiefComplaint,
    symptoms,
    medicalHistory,
    urgencyLevel,
    status: "pending",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  });

  // 3. Update slot status to pending approval
  await timeSlotRepository.updateStatus(slotId, "pending_approval");

  // 4. Send notification to doctor
  await notificationService.notifyDoctorNewRequest(request);

  // 5. Schedule Inngest workflow for approval timeout
  await inngestEventService.sendReservationRequestCreated({
    requestId: request.id,
    profileId,
    slotId,
    // ... other data
  });

  return {
    success: true,
    request,
    message: "Solicitud recibida. El doctor la revisará pronto.",
  };
};
```

### 2. Doctor Approval Interface

```typescript
// Doctor Dashboard Component
export const DoctorPendingRequests = () => {
  const { data: requests } = useQuery(['pending-requests', profileId],
    () => reservationService.getPendingRequests(profileId)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Solicitudes Pendientes</h2>

      {requests?.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-semibold">{request.patientName}</h3>
              <p className="text-sm text-gray-600">📞 {request.patientPhone}</p>
              <p className="text-sm">🩺 {request.chiefComplaint}</p>
              <p className="text-sm">📅 {format(request.requestedTime, 'PPP', { locale: es })}</p>
              <Badge variant={getUrgencyColor(request.urgencyLevel)}>
                {request.urgencyLevel}
              </Badge>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(request)}
              >
                ✏️ Editar
              </Button>
              <Button
                size="sm"
                onClick={() => approveRequest(request.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                ✅ Aprobar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => rejectRequest(request.id)}
              >
                ❌ Rechazar
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

### 3. WhatsApp Notification Templates

```typescript
// Doctor notification templates
const doctorNotificationTemplates = {
  newRequest: {
    name: "doctor_new_request",
    language: "es",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: "🩺 Nueva Solicitud de Cita" }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: "{{patient_name}}" },
          { type: "text", text: "{{patient_phone}}" },
          { type: "text", text: "{{service_name}}" },
          { type: "text", text: "{{appointment_date}}" },
          { type: "text", text: "{{appointment_time}}" },
          { type: "text", text: "{{urgency_level}}" },
          { type: "text", text: "{{chief_complaint}}" },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        parameters: [
          { type: "payload", payload: "APPROVE_{{request_id}}" },
          { type: "text", text: "✅ Aprobar" },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        parameters: [
          { type: "payload", payload: "REJECT_{{request_id}}" },
          { type: "text", text: "❌ Rechazar" },
        ],
      },
    ],
  },
};
```

### 4. Request Expiration Handling

```typescript
// Inngest workflow for request expiration
export const requestExpirationWorkflow = inngest.createFunction(
  { id: "request-expiration" },
  { event: "reservation/request-created" },
  async ({ event, step }) => {
    const { requestId, expiresAt } = event.data;

    // Wait until expiration time
    await step.sleepUntil("wait-for-expiration", new Date(expiresAt));

    // Check if request is still pending
    const request = await step.run("check-request-status", async () => {
      return await reservationRequestRepository.findById(requestId);
    });

    if (request && request.status === "pending") {
      // Expire the request
      await step.run("expire-request", async () => {
        await reservationRequestRepository.updateStatus(requestId, "expired");
        await timeSlotRepository.updateStatus(request.slotId, "available");
      });

      // Notify patient
      await step.run("notify-patient-expired", async () => {
        await whatsappService.sendTemplate({
          to: request.patientPhone,
          template: "request_expired",
          variables: {
            patientName: request.patientName,
            serviceName: "Service Name", // Get from service
          },
        });
      });

      // Notify doctor
      await step.run("notify-doctor-expired", async () => {
        await whatsappService.sendTemplate({
          to: doctorPhone, // Get from profile
          template: "request_expired_doctor",
          variables: {
            patientName: request.patientName,
            requestedTime: request.requestedTime,
          },
        });
      });
    }

    return { requestId, expired: request?.status === "pending" };
  },
);
```

## 📊 Request Statistics

### Doctor Dashboard Metrics

```typescript
interface DoctorDashboardStats {
  pendingRequests: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: number; // minutes
  approvalRate: number; // percentage
  urgentRequests: number;
}

const getDoctorStats = async (
  profileId: string,
): Promise<DoctorDashboardStats> => {
  const [
    pendingCount,
    approvedToday,
    rejectedToday,
    urgentCount,
    avgApprovalTime,
    totalRequests,
  ] = await Promise.all([
    reservationRequestRepository.countPendingByProfileId(profileId),
    reservationRequestRepository.countApprovedToday(profileId),
    reservationRequestRepository.countRejectedToday(profileId),
    reservationRequestRepository.countUrgentPending(profileId),
    reservationRequestRepository.getAverageApprovalTime(profileId),
    reservationRequestRepository.countTotalRequests(profileId),
  ]);

  return {
    pendingRequests: pendingCount,
    approvedToday: approvedToday,
    rejectedToday: rejectedToday,
    urgentRequests: urgentCount,
    averageApprovalTime: avgApprovalTime,
    approvalRate: totalRequests > 0 ? (approvedToday / totalRequests) * 100 : 0,
  };
};
```

## 🚨 Error Handling

### Common Error Scenarios

```typescript
const handleRequestErrors = {
  SLOT_NOT_AVAILABLE: {
    code: "SLOT_UNAVAILABLE",
    message: "Este horario ya no está disponible",
    userMessage:
      "Lo sentimos, este horario ya fue reservado. Por favor selecciona otro.",
  },
  SLOT_FULLY_BOOKED: {
    code: "SLOT_FULL",
    message: "Este horario está completamente reservado",
    userMessage:
      "Este horario ya está lleno. Intenta con otro horario o fecha.",
  },
  REQUEST_EXPIRED: {
    code: "REQUEST_EXPIRED",
    message: "La solicitud expiró sin respuesta",
    userMessage: "Tu solicitud expiró. Por favor intenta de nuevo.",
  },
  DOCTOR_NOT_AVAILABLE: {
    code: "DOCTOR_UNAVAILABLE",
    message: "El doctor no está disponible para revisar solicitudes",
    userMessage:
      "El doctor no está disponible en este momento. Intenta más tarde.",
  },
};
```

## 📱 WhatsApp Quick Replies

### Doctor Quick Response Buttons

```typescript
// Quick reply buttons for doctor approval
const quickReplyButtons = {
  approve: {
    type: "reply",
    reply: {
      id: "APPROVE_REQUEST",
      title: "✅ Aprobar",
    },
  },
  reject: {
    type: "reply",
    reply: {
      id: "REJECT_REQUEST",
      title: "❌ Rechazar",
    },
  },
  edit: {
    type: "reply",
    reply: {
      id: "EDIT_REQUEST",
      title: "✏️ Editar",
    },
  },
};
```

## 🎯 Success Metrics

### Request Processing KPIs

- **Average approval time**: < 15 minutes
- **Request expiration rate**: < 10%
- **Doctor response rate**: > 80%
- **Patient satisfaction**: > 4.5/5
- **System availability**: > 99.9%

### Quality Metrics

- **Approval accuracy**: > 95%
- **Medical information completeness**: > 90%
- **Urgent request handling**: < 5 minutes average
- **No-show prediction accuracy**: > 85%

## 🔄 Next Steps

✅ **All Phase 3 Implementation Complete:**

1. ✅ **Slot state management** - Implemented in DB schema and services
2. ✅ **Request → approval workflow** - Complete with validation and transitions
3. ✅ **Doctor dashboard UI** - Created at `packages/web/src/pages/dashboard/PendingRequestsPage.tsx`
4. ✅ **WhatsApp notifications** - Implemented via Evolution API
5. ✅ **Request expiration system** - Inngest cron workflow functional
6. ✅ **API endpoints** - All routes mounted and working
7. ✅ **React hooks** - Frontend integration complete
8. ✅ **Inngest events** - Request/approval/rejection events emitting
9. ✅ **Documentation** - All reference files created

## 🎉 Phase 3: Request & Approval System - **IMPLEMENTATION COMPLETE** ✅

### What Was Built

**Backend (packages/api)**:
- Slot status transitions (`available` → `pending_approval` → `reserved`)
- Request creation with validation
- Approval/rejection logic with slot management
- Expiration workflow running every 5 minutes
- WhatsApp notifications via Evolution API
- Inngest event emission for workflow tracking

**Frontend (packages/web)**:
- Doctor dashboard for pending requests
- React hooks for requests and stats
- Approval/rejection UI with confirmation dialogs
- Real-time updates after actions
- Expiration countdown timers

**Integration**:
- API endpoints mounted at `/api/reservations/*`
- Services registered in DI container
- Repository layer for data access
- Inngest workflows for automation

### Files Created/Modified

**Created**:
- `packages/web/src/hooks/use-reservation-requests.ts`
- `packages/web/src/pages/dashboard/PendingRequestsPage.tsx`
- `migrations/phase-03-request-approval/doctor-dashboard.md`
- `migrations/phase-03-request-approval/notification-system.md`

**Modified**:
- `packages/api/src/index.ts` - Mounted reservation routes
- `packages/api/src/api/routes/reservations.ts` - Fixed imports, complete endpoints
- `packages/api/src/services/business/notification.ts` - Complete notification logic
- `packages/api/src/plugins/services.ts` - Service registration
- `packages/api/src/services/business/reservation-request.ts` - Event emission
- `packages/api/src/services/business/approval.ts` - Event emission
- `packages/api/src/inngest/functions.ts` - Expiration workflow
- `packages/api/src/services/repository/profile.ts` - Added findById method

### Ready for Phase 4

The system is ready for **Phase 4: Pre-Confirmation Editing**, which will add:
- Edit modal for doctors to modify time/service/price before approval
- Change validation and conflict detection
- Approval with changes workflow
- Updated notification templates showing changes

**Phase 3 Status: ✅ COMPLETE - Ready for Phase 4**
