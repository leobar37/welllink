# Doctor Dashboard for Request Approvals

## Overview

The doctor dashboard provides an interface for medical professionals to review, approve, and reject pending appointment requests from patients. It displays all relevant patient and medical information in a clear, actionable format.

## Components

### 1. Pending Requests List

**Location**: `packages/web/src/pages/dashboard/PendingRequestsPage.tsx`

**Features**:
- List of all pending reservation requests
- Patient information (name, phone, age, gender)
- Appointment details (date, time, service)
- Medical information (chief complaint, symptoms, medical history, allergies)
- Urgency level badges
- Expiration countdown timer

**Data Structure**:
```typescript
interface PendingRequest {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  chiefComplaint?: string;
  symptoms?: string;
  medicalHistory?: string;
  allergies?: string;
  urgencyLevel: "low" | "normal" | "high" | "urgent";
  status: "pending";
  requestedTime: string;
  expiresAt: string;
  slot: TimeSlot;
  service: MedicalService;
}
```

### 2. Request Action Buttons

**Actions Available**:
- **Approve**: Approve the request and create reservation
- **Reject**: Reject the request with a reason
- **Edit** (Future): Modify time/service before approving (Phase 4)

### 3. Approval Modal

When clicking "Approve", the doctor can:
- Add notes for the appointment
- Optionally modify time slot (Phase 4)
- Optionally change service (Phase 4)
- Optionally adjust price (Phase 4)

### 4. Rejection Dialog

When clicking "Reject", the doctor must:
- Provide a rejection reason (required)
- Choose from common reasons or write custom reason

**Common Rejection Reasons**:
- Horario no disponible
- Paciente no calificado
- Servicio suspendido temporalmente
- Conflicto con otra cita
- Información incompleta

## Urgency Levels

| Level | Color | Description |
|-------|--------|-------------|
| low | Blue | Routine checkup |
| normal | Yellow | Standard appointment |
| high | Orange | Urgent but not emergency |
| urgent | Red | Medical emergency |

## Expiration Handling

**Default Timeout**: 30 minutes from request creation

**Countdown Display**:
```
Expira en 15 min
```

**After Expiration**:
- Request status → `expired`
- Slot status → `available`
- Patient receives expiration notification via WhatsApp
- Doctor receives expiration notification

## API Integration

### Fetching Pending Requests

**Endpoint**: `GET /api/reservations/pending/:profileId`

**Response**:
```typescript
{
  requests: PendingRequest[];
}
```

### Approving a Request

**Endpoint**: `POST /api/reservations/approve`

**Request Body**:
```typescript
{
  requestId: string;
  approvedBy: string; // doctor's profile ID
  notes?: string;
  changes?: {
    serviceId?: string;
    timeSlotId?: string;
    price?: number;
  };
}
```

**Response**:
```typescript
{
  request: ReservationRequest;
  reservation: Reservation;
  slot: TimeSlot;
  changes?: object;
}
```

### Rejecting a Request

**Endpoint**: `POST /api/reservations/reject`

**Request Body**:
```typescript
{
  requestId: string;
  rejectedBy: string; // doctor's profile ID
  rejectionReason: string;
}
```

**Response**:
```typescript
{
  request: ReservationRequest;
  slot: TimeSlot;
}
```

## React Hooks

**Location**: `packages/web/src/hooks/use-reservation-requests.ts`

### Available Hooks

```typescript
// Fetch pending requests for a doctor
usePendingRequests(profileId?: string)

// Fetch reservation statistics
useReservationStats(profileId?: string)

// Approve a request mutation
useApproveRequest()

// Reject a request mutation
useRejectRequest()
```

## User Flow

1. Doctor navigates to Dashboard → Solicitudes Pendientes
2. Dashboard loads pending requests via `usePendingRequests()`
3. Each request displays patient info, medical details, and urgency
4. Doctor reviews request information
5. **Approve**: Clicks Aprobar button → Confirmation → Reservation created
6. **Reject**: Clicks Rechazar button → Dialog → Enter reason → Request rejected
7. Patient receives WhatsApp notification (approve/reject)
8. List refreshes automatically after action

## UI Components Used

- `Card` - Request container
- `Badge` - Urgency level indicator
- `Button` - Action buttons (Approve/Reject)
- `AlertDialog` - Rejection confirmation dialog
- `Textarea` - Notes field and rejection reason field
- `Label` - Form labels
- `Loader2` - Loading indicator
- `Calendar`, `Phone`, `User`, `Clock`, `CheckCircle`, `XCircle`, `AlertCircle` - Icons

## Styling

**Tailwind Classes**:
- Spacing: `space-y-4`, `space-y-6`, `gap-2`
- Colors: `bg-green-600`, `bg-red-600`, `text-muted-foreground`
- Layout: `flex`, `items-center`, `justify-between`

## Future Enhancements (Phase 4)

- Edit modal for changing time/service before approval
- Bulk approve/reject for multiple requests
- Filters by urgency, date range, service
- Sort options (newest, oldest, urgency)
- Request history view
- Export requests to CSV

## Implementation Status

✅ **Completed**:
- Pending requests list UI
- Patient information display
- Medical information display
- Approve button functionality
- Reject button with reason dialog
- Expiration countdown timer
- Urgency level badges
- API hooks for requests
- Real-time list updates after actions

⏳ **Pending (Phase 4)**:
- Edit modal for time/service changes
- Bulk actions
- Filters and sorting
- Request history view
