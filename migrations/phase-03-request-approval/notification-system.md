# Notification System for Request & Approval Workflow

## Overview

The notification system sends real-time alerts to doctors and patients throughout the reservation request lifecycle. It uses WhatsApp as the primary channel via Evolution API, with SMS and email as fallback options.

## Architecture

```
Patient Request Created
    ↓
NotificationService.notifyDoctorNewRequest()
    ↓
Evolution API → WhatsApp Message
    ↓
Doctor receives notification
    ↓
[Doctor approves/rejects in dashboard]
    ↓
NotificationService.notifyPatientApproval() OR notifyPatientRejection()
    ↓
Evolution API → WhatsApp Message
    ↓
Patient receives confirmation
```

## Notification Types

### 1. Doctor Notifications

#### New Request Notification

**Trigger**: When a patient submits a reservation request

**Sent To**: Doctor's WhatsApp number (from `profile.phone`)

**Template**:
```typescript
🩺 *NUEVA SOLICITUD DE CITA*

 👤 *Paciente:* {patientName}
 📞 *Teléfono:* {patientPhone}
 🏥 *Servicio:* {serviceName}
 📅 *Fecha:* {appointmentDate}
 🕐 *Hora:* {appointmentTime}
 ⚡ *Urgencia:* {urgencyLevel}

 📝 *Motivo:*
 {chiefComplaint}

---
 Responde en el dashboard para aprobar o rechazar esta solicitud.
```

**Implementation**: `packages/api/src/services/business/notification.ts:63-104`

**Parameters**:
- `profileId`: Doctor's profile ID
- `slotId`: Requested time slot ID
- `serviceId`: Requested service ID
- `patientName`, `patientPhone`: Patient contact info
- `appointmentDate`, `appointmentTime`: When appointment is requested
- `urgencyLevel`: "low" | "normal" | "high" | "urgent"
- `chiefComplaint`: Patient's main medical concern

#### Request Expiration Notification

**Trigger**: When a pending request expires (30-minute timeout)

**Sent To**: Doctor's WhatsApp number

**Template**:
```typescript
⏰ *SOLICITUD EXPIRADA*

La solicitud de cita del paciente {patientName} ha expirado sin respuesta.

 📅 *Fecha solicitada:* {requestedDate}
 🕐 *Hora:* {requestedTime}

 El horario ha sido liberado y está disponible para otros pacientes.
```

**Implementation**: `packages/api/src/services/business/notification.ts:232-274`

### 2. Patient Notifications

#### Approval Notification

**Trigger**: When doctor approves a request

**Sent To**: Patient's WhatsApp phone number

**Template**:
```typescript
✅ *SOLICITUD APROBADA*

¡Hola {patientName}!

Tu solicitud de cita ha sido *aprobada*.

 🏥 *Servicio:* {serviceName}
 📅 *Fecha:* {appointmentDate}
 🕐 *Hora:* {appointmentTime}

📝 *Cambios realizados:*
 {changesSection}

📌 *Importante:* Si no puedes asistir, avisa con al menos 24 horas de antelación.
```

**Changes Section** (optional):
```typescript
• Fecha: {newDate}
• Hora: {newTime}
• Servicio: {newService}
```

**Implementation**: `packages/api/src/services/business/notification.ts:106-165`

**Parameters**:
- `profileId`: Doctor's profile ID (for WhatsApp config)
- `serviceId`: Service ID (to fetch service name)
- `slotId`: Slot ID
- `patientPhone`, `patientName`: Patient info
- `appointmentDate`, `appointmentTime`: Confirmed appointment time
- `changes`: Optional changes made by doctor

#### Rejection Notification

**Trigger**: When doctor rejects a request

**Sent To**: Patient's WhatsApp phone number

**Template**:
```typescript
❌ *SOLICITUD NO APROBADA*

Hola {patientName},

Lamentamos informarte que tu solicitud de cita *no ha podido ser aprobada* en este momento.

 📝 *Motivo:*
 {rejectionReason}

Te invitamos a intentar con otra fecha u horario disponible.

Si tienes alguna pregunta, puedes contactar directamente al médico.
```

**Implementation**: `packages/api/src/services/business/notification.ts:167-198`

**Parameters**:
- `profileId`: Doctor's profile ID
- `patientPhone`, `patientName`: Patient info
- `rejectionReason`: Doctor's reason for rejection

#### Expiration Notification

**Trigger**: When patient's request expires without doctor response

**Sent To**: Patient's WhatsApp phone number

**Template**:
```typescript
⏰ *SOLICITUD EXPIRADA*

Hola {patientName},

Tu solicitud de cita para {serviceName} ha *expirado* por falta de respuesta del médico.

Te invitamos a intentar con otra fecha u horario disponible.
```

**Implementation**: `packages/api/src/services/business/notification.ts:200-230`

**Parameters**:
- `profileId`: Doctor's profile ID
- `patientPhone`, `patientName`: Patient info
- `serviceName`: Name of requested service

## Notification Service

**Location**: `packages/api/src/services/business/notification.ts`

### Constructor Dependencies

```typescript
constructor(
  private whatsappConfigRepository: WhatsAppConfigRepository,
  private profileRepository: ProfileRepository,
  private medicalServiceRepository: MedicalServiceRepository,
  private evolutionService: EvolutionService,
)
```

### Key Methods

#### 1. Get WhatsApp Configuration

```typescript
private async getWhatsAppConfig(profileId: string) {
  const configs = await this.whatsappConfigRepository.findByProfile(profileId);
  const activeConfig = configs.find((c) => c.isEnabled && c.isConnected);
  if (!activeConfig) {
    throw new Error("No active WhatsApp configuration found for this profile");
  }
  return activeConfig;
}
```

**Purpose**: Retrieves the active WhatsApp instance for a profile

**Location**: `notification.ts:51-61`

#### 2. Format Phone Number

```typescript
const formattedPhone = this.evolutionService.formatPhoneNumber(phone);
```

**Purpose**: Ensures phone is in correct international format

**Location**: Evolution API service

#### 3. Send WhatsApp Message

```typescript
await this.evolutionService.sendText(config.instanceName, {
  number: formattedPhone,
  text: message,
});
```

**Purpose**: Sends text message via Evolution API

**Location**: All notification methods

## Error Handling

### Notification Failures

When a notification fails:
1. **Error is logged**: `console.error("Error sending notification:", error)`
2. **Returns failure status**: `{ success: false, error }`
3. **Does not block workflow**: Request approval/rejection continues

**Example**:
```typescript
try {
  await this.evolutionService.sendText(config.instanceName, { ... });
  return { success: true };
} catch (error) {
  console.error("Error sending doctor notification:", error);
  return { success: false, error };
}
```

### WhatsApp Configuration Missing

**Error**: "No active WhatsApp configuration found for this profile"

**Solution**:
- Doctor must configure WhatsApp in Settings
- Enable WhatsApp integration
- Verify connection status

### Profile/Service Not Found

**Errors**:
- "Doctor profile not found or no phone configured"
- "Medical service not found"

**Solution**: 
- Verify profile exists and has `phone` field
- Verify service ID is valid
- Check database integrity

## Inngest Integration

### Event Triggers

#### New Request Event

**Event Name**: `reservation/request-created`

**Emitted From**: `packages/api/src/services/business/reservation-request.ts:95`

**Data**:
```typescript
{
  requestId: string;
  profileId: string;
  slotId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  chiefComplaint?: string;
  urgencyLevel: string;
  requestedTime: string;
  expiresAt: string;
}
```

#### Approved Event

**Event Name**: `reservation/approved`

**Emitted From**: `packages/api/src/services/business/approval.ts:131`

**Data**:
```typescript
{
  reservationId: string;
  profileId: string;
  requestId: string;
  approvedBy: string;
  approvedAt: string;
  changes?: {
    originalTime?: string;
    newTime?: string;
    originalService?: string;
    newService?: string;
    notes?: string;
    priceAdjustment?: number;
  };
}
```

#### Rejected Event

**Event Name**: `reservation/rejected`

**Emitted From**: `packages/api/src/services/business/approval.ts:191`

**Data**:
```typescript
{
  requestId: string;
  profileId: string;
  rejectionReason: string;
  rejectedBy: string;
  rejectedAt: string;
}
```

#### Expiration Event

**Event Name**: `doctor/request-expired`

**Emitted From**: `packages/api/src/inngest/functions.ts:102`

**Data**:
```typescript
{
  profileId: string;
  requestId: string;
  patientName: string;
  expiredAt: string;
}
```

## Future Enhancements

### Phase 5: Reminder Workflows

- 24-hour appointment reminders
- 2-hour appointment reminders
- Post-appointment follow-ups
- No-show notifications

### Phase 7: Advanced Features

- Multi-channel notifications (SMS, email, WhatsApp)
- Notification preferences per patient
- Scheduled notification campaigns
- Notification templates with variables
- Analytics on notification delivery

## Testing

### Manual Testing

1. **Test New Request Notification**:
   - Create a reservation request
   - Verify doctor receives WhatsApp message
   - Check message formatting

2. **Test Approval Notification**:
   - Approve a pending request
   - Verify patient receives confirmation
   - Check for changes if applicable

3. **Test Rejection Notification**:
   - Reject a pending request with reason
   - Verify patient receives rejection message
   - Check reason is included

4. **Test Expiration Notification**:
   - Wait for 30-minute timeout
   - Verify patient receives expiration message
   - Verify doctor receives expiration notification

### Automated Testing

**Test Files**: (To be created in Phase 7)

- `notification-service.test.ts`
- `evolution-integration.test.ts`
- `notification-templates.test.ts`

## Implementation Status

✅ **Completed**:
- Doctor new request notifications
- Patient approval notifications
- Patient rejection notifications
- Request expiration notifications (doctor & patient)
- WhatsApp message formatting in Spanish
- Service name retrieval from repository
- Doctor phone retrieval from profile
- Error handling and logging
- Inngest event emission

⏳ **Pending (Phase 5)**:
- 24-hour reminder notifications
- 2-hour reminder notifications
- Post-appointment follow-up notifications

⏳ **Pending (Phase 7)**:
- SMS fallback
- Email notifications
- Multi-channel delivery
- Notification preferences
- Delivery analytics
