# Plan de Implementación - Módulo de Citas Médicas

> **Estado Actual**: Backend 80% completo | Frontend 60% completo
>
> **Última actualización**: 2026-01-14

---

## Resumen Ejecutivo

### ✅ Completado
- [x] Schema de base de datos completo (5 tablas)
- [x] Repositories para todas las entidades
- [x] Services de negocio (ReservationRequest, Approval)
- [x] API Routes básicas (/reservations/*)
- [x] Dashboard de solicitudes pendientes
- [x] Componentes UI (RequestCard, ApprovalDialog, RejectionDialog)
- [x] Hooks de React (useReservationRequests, useMedicalServices)
- [x] Inngest functions base (slot-generation, reminders)

### 🔄 En Progreso
- [ ] Integración completa de Inngest workflows
- [ ] Sistema de recordatorios automatizado

### ⏳ Pendiente
- [ ] UI de reglas de disponibilidad
- [ ] UI de gestión de slots
- [ ] UI de calendario para pacientes
- [ ] Gestión de reservas confirmadas
- [ ] Historial de pacientes
- [ ] Notificaciones personalizables

---

## Roadmap de Implementación

### FASE 1: Configuración de Disponibilidad (Prioridad ALTA)

**Objetivo**: Doctor configura sus horarios de atención

#### 1.1 Backend - Availability Rules API
```typescript
// packages/api/src/api/routes/availability.ts
- GET    /availability/:profileId        // Listar reglas
- POST   /availability                   // Crear regla
- PUT    /availability/:id               // Actualizar regla
- DELETE /availability/:id               // Eliminar regla
- GET    /availability/preview/:profileId // Previsualizar slots generados
```

**Campos:**
- dayOfWeek: 0-6 (Domingo-Sábado)
- startTime: "09:00"
- endTime: "17:00"
- slotDuration: 30 (minutos)
- bufferTime: 0 (minutos entre citas)
- maxAppointmentsPerSlot: 1
- effectiveFrom: fecha inicio
- effectiveTo: fecha fin (opcional)

**Validaciones:**
- [ ] endTime > startTime
- [ ] slotDuration >= 15
- [ ] Sin solapamiento de reglas para el mismo día
- [ ] effectiveTo > effectiveFrom (si se proporciona)

#### 1.2 Frontend - Availability Rules UI
```typescript
// packages/web/src/pages/dashboard/Availability.tsx
```

**Componentes:**
- [ ] `AvailabilityRulesList` - Lista de reglas por día
- [ ] `AvailabilityRuleForm` - Formulario crear/editar
- [ ] `AvailabilityPreview` - Previsualización de slots generados
- [ ] `DaySelector` - Selector de días de la semana

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Configuración de Disponibilidad                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Lunes]    [Martes]   [Miércoles]  [Jueves]   [Viernes] │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Lunes                                           │    │
│  │ 09:00 - 17:00 | Slots de 30 min | [Editar] [×] │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Martes                                          │    │
│  │ 09:00 - 14:00 | Slots de 45 min | [Editar] [×] │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [+ Agregar nueva regla]                                │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Previsualización                                │    │
│  │ Próxima semana generará:                        │    │
│  │ Lunes: 16 slots                                 │    │
│  │ Martes: 11 slots                                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 1.3 Hook - useAvailabilityRules
```typescript
// packages/web/src/hooks/use-availability-rules.ts
export function useAvailabilityRules(profileId: string) {
  return useQuery({
    queryKey: ["availability-rules", profileId],
    queryFn: async () => {
      const { data } = await api.api.availability[profileId].get()
      return data
    }
  })
}

export function useCreateAvailabilityRule() { ... }
export function useUpdateAvailabilityRule() { ... }
export function useDeleteAvailabilityRule() { ... }
```

---

### FASE 2: Gestión de Slots (Prioridad ALTA)

**Objetivo**: Doctor ve y gestiona sus slots disponibles

#### 2.1 Backend - Slots Management API
```typescript
// packages/api/src/api/routes/slots.ts
- GET    /slots/:profileId              // Listar slots
- GET    /slots/:profileId/available    // Slots disponibles
- POST   /slots/batch                   // Crear múltiples slots
- PUT    /slots/:id/status              // Cambiar estado
- DELETE /slots/:id                     // Eliminar slot
- GET    /slots/preview                 // Previsualizar generación
```

**Estados de slot:**
- `available` - Disponible para reserva
- `pending_approval` - En espera de aprobación
- `reserved` - Confirmado
- `expired` - Expiró el tiempo de espera
- `blocked` - Bloqueado manualmente

#### 2.2 Frontend - Slots Management UI
```typescript
// packages/web/src/pages/dashboard/Slots.tsx
```

**Componentes:**
- [ ] `SlotsCalendar` - Calendario mensual de slots
- [ ] `SlotsList` - Lista de slots por fecha
- [ ] `SlotActionsMenu` - Menú de acciones (bloquear/liberar)
- [ ] `BatchSlotGenerator` - Generador masivo de slots

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Gestión de Slots                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [← Enero 2026 →]                                      │
│                                                          │
│  Lu  Ma  Mi  Ju  Vi  Sá  Do                            │
│  [ ] [ ] [ ] [ ] [ ] -- --                            │
│  15  16  17  18  19  20  21                            │
│                                                          │
│  [ ] = disponible  [X] = ocupado  [--] = bloqueado      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Slots del 15 de Enero                          │    │
│  │                                                 │    │
│  │ 09:00 - 09:30  [Disponible]  [Bloquear]        │    │
│  │ 09:30 - 10:00  [Ocupado]       [Ver detalles]  │    │
│  │ 10:00 - 10:30  [Disponible]  [Bloquear]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [+ Generar slots para próxima semana]                   │
└─────────────────────────────────────────────────────────┘
```

#### 2.3 Hook - useSlots
```typescript
// packages/web/src/hooks/use-slots.ts
export function useSlots(profileId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["slots", profileId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.api.slots[profileId].get({
        query: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      })
      return data
    }
  })
}
```

---

### FASE 3: UI de Reserva para Pacientes (Prioridad MEDIA)

**Objetivo**: Paciente selecciona servicio y horario desde perfil público

#### 3.1 Backend - Public Slots API
```typescript
// packages/api/src/api/routes/public.ts (extender)
- GET /public/:username/slots/:serviceId  // Slots disponibles del servicio
- GET /public/:username/services          // Listar servicios activos
```

#### 3.2 Frontend - Booking Flow
```typescript
// packages/web/src/components/booking/booking-flow.tsx
```

**Pasos del flujo:**
1. **Selección de Servicio**
   - Lista de servicios con imagen, nombre, precio, duración
   - Categorías/filtros

2. **Selección de Fecha/Hora**
   - Calendario de fechas disponibles
   - Lista de horas por fecha

3. **Formulario de Datos**
   - Nombre completo *
   - Teléfono (WhatsApp) *
   - Email (opcional)
   - Edad, género
   - Motivo de consulta
   - Síntomas
   - Nivel de urgencia

4. **Confirmación**
   - Resumen de la cita
   - Botón "Enviar Solicitud"

**Componentes:**
- [ ] `ServiceSelector` - Selector de servicios
- [ ] `SlotCalendar` - Calendario de slots disponibles
- [ ] `BookingForm` - Formulario de datos del paciente
- [ ] `BookingSummary` - Resumen y confirmación

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Reservar Cita                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Paso 1 de 3: Selecciona un servicio                   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ [Imagen]     │  │ [Imagen]     │  │ [Imagen]     │ │
│  │ Consulta     │  │ Nutrición    │  │ Psicoterapia │ │
│  │ General      │  │              │  │              │ │
│  │              │  │              │  │              │ │
│  │ 30 min       │  │ 45 min       │  │ 60 min       │ │
│  │ $50.00       │  │ $75.00       │  │ $100.00      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  [Siguiente →]                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Paso 2 de 3: Selecciona fecha y hora                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [← Enero 2026 →]                                      │
│                                                          │
│  Lu  Ma  Mi  Ju  Vi  Sá  Do                            │
│  15  16  17  18  19  20  21                            │
│  [✓] [ ] [ ] [ ] [ ] -- --                            │
│                                                          │
│  Horarios disponibles para el 15 de Enero:              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 09:00 - 09:30  [Seleccionar]                    │    │
│  │ 10:00 - 10:30  [Seleccionar]                    │    │
│  │ 11:00 - 11:30  [Seleccionar]                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [← Atrás]  [Siguiente →]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Paso 3 de 3: Tus datos                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nombre completo *                                      │
│  [María García López]                                   │
│                                                          │
│  Teléfono (WhatsApp) *                                  │
│  [+52 55 1234 5678]                                     │
│                                                          │
│  Email                                                  │
│  [maria@email.com]                                      │
│                                                          │
│  Motivo de consulta                                     │
│  [Consulta general de rutina...]                        │
│                                                          │
│  Nivel de urgencia                                      │
│  ( ) Baja  (•) Normal  ( ) Alta  ( ) Urgente           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Resumen de tu cita                              │    │
│  │                                                 │    │
│  │ Servicio: Consulta General                      │    │
│  │ Fecha: 15 de Enero, 2026                        │    │
│  │ Hora: 09:00 - 09:30                             │    │
│  │ Precio: $50.00                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [← Atrás]  [Enviar Solicitud]                          │
└─────────────────────────────────────────────────────────┘
```

#### 3.3 Hook - useBooking
```typescript
// packages/web/src/hooks/use-booking.ts
export function useBooking() {
  return useMutation({
    mutationFn: async (data: BookingData) => {
      const { data: result } = await api.api.reservations.request.post(data)
      return result
    }
  })
}
```

---

### FASE 4: Gestión de Reservas Confirmadas (Prioridad MEDIA)

**Objetivo**: Doctor gestiona sus citas confirmadas

#### 4.1 Backend - Reservations API
```typescript
// packages/api/src/api/routes/reservations.ts (extender)
- GET    /reservations/:profileId           // Listar reservas
- GET    /reservations/:id/details         // Detalles de reserva
- PUT    /reservations/:id/cancel          // Cancelar reserva
- PUT    /reservations/:id/complete        // Marcar como completada
- PUT    /reservations/:id/no-show         // Marcar como no-show
- POST   /reservations/:id/notes           // Agregar nota
```

#### 4.2 Frontend - Reservations Management UI
```typescript
// packages/web/src/pages/dashboard/Reservations.tsx
```

**Componentes:**
- [ ] `ReservationsList` - Lista de reservas confirmadas
- [ ] `ReservationCard` - Tarjeta de reserva individual
- [ ] `ReservationDetails` - Modal con detalles completos
- [ ] `CancelReservationDialog` - Diálogo de cancelación
- [ ] `CompleteReservationDialog` - Diálogo de completar

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Citas Confirmadas                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Próximas]  [Completadas]  [Canceladas]                │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ María García López                              │    │
│  │ 15 Ene, 09:00 - 09:30                           │    │
│  │ Consulta General - $50.00                       │    │
│  │ [Ver detalles] [Cancelar] [Completar]           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Juan Pérez Martínez                             │    │
│  │ 16 Ene, 10:00 - 10:30                           │    │
│  │ Nutrición - $75.00                              │    │
│  │ [Ver detalles] [Cancelar] [Completar]           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 4.3 Hook - useReservations
```typescript
// packages/web/src/hooks/use-reservations.ts
export function useReservations(profileId: string, status?: ReservationStatus) {
  return useQuery({
    queryKey: ["reservations", profileId, status],
    queryFn: async () => {
      const { data } = await api.api.reservations[profileId].get({
        query: status ? { status } : undefined
      })
      return data
    }
  })
}
```

---

### FASE 5: Historial de Pacientes (Prioridad BAJA)

**Objetivo**: Doctor ve historial completo de un paciente

#### 5.1 Backend - Patient History API
```typescript
// packages/api/src/api/routes/patients.ts
- GET    /patients/:phone               // Historial del paciente
- GET    /patients/:phone/stats        // Estadísticas del paciente
- GET    /patients/:phone/notes        // Notas del paciente
```

#### 5.2 Frontend - Patient History UI
```typescript
// packages/web/src/pages/dashboard/PatientHistory.tsx
```

**Componentes:**
- [ ] `PatientHeader` - Información básica del paciente
- [ ] `PatientTimeline` - Timeline de citas
- [ ] `PatientNotes` - Notas médicas
- [ ] `PatientStats` - Estadísticas

---

### FASE 6: Notificaciones Personalizables (Prioridad BAJA)

**Objetivo**: Doctor personaliza los mensajes automáticos

#### 6.1 Backend - Notification Templates API
```typescript
// packages/api/src/api/routes/notification-templates.ts
- GET    /notification-templates/:profileId  // Listar templates
- PUT    /notification-templates/:id         // Actualizar template
```

#### 6.2 Frontend - Notification Templates UI
```typescript
// packages/web/src/pages/dashboard/NotificationTemplates.tsx
```

**Templates personalizables:**
- Solicitud recibida (paciente)
- Cita aprobada (paciente)
- Cita rechazada (paciente)
- Recordatorio 24h (paciente)
- Recordatorio 2h (paciente)
- Nueva solicitud (doctor)

---

## Dependencias entre Fases

```
FASE 1 (Disponibilidad)
        ↓
    FASE 2 (Slots)
        ↓
    FASE 3 (Booking Pacientes)
        ↓
    FASE 4 (Gestión Reservas)
        ↓
    FASE 5 (Historial)
        ↓
    FASE 6 (Notificaciones)
```

**Fases paralelas:**
- FASE 5 y FASE 6 son independientes
- FASE 1 puede desarrollarse en paralelo con mejoras en FASE 2

---

## Checklist de Implementación

### Backend
- [ ] Completar `AvailabilityRulesService`
- [ ] Crear `SlotsService` con métodos de gestión
- [ ] Extender `NotificationService` con templates
- [ ] Crear `PatientsService` para historial
- [ ] Completar workflows de Inngest (reminders, expiration)

### Frontend
- [ ] Página `/dashboard/availability`
- [ ] Página `/dashboard/slots`
- [ ] Flujo de booking en perfil público
- [ ] Página `/dashboard/reservations` (completa)
- [ ] Página `/dashboard/patient-history`
- [ ] Página `/dashboard/notification-templates`

### Componentes
- [ ] `AvailabilityRuleForm`
- [ ] `SlotsCalendar`
- [ ] `BookingFlow`
- [ ] `ReservationCard` (extendido)
- [ ] `PatientTimeline`
- [ ] `NotificationTemplateEditor`

### Hooks
- [ ] `useAvailabilityRules`
- [ ] `useSlots`
- [ ] `useBooking`
- [ ] `useReservations`
- [ ] `usePatientHistory`
- [ ] `useNotificationTemplates`

---

## Estimación de Esfuerzo

| Fase | Complejidad | Estimado |
|------|-------------|----------|
| FASE 1: Disponibilidad | Media | 2-3 días |
| FASE 2: Slots | Media | 2-3 días |
| FASE 3: Booking | Alta | 4-5 días |
| FASE 4: Reservas | Baja | 1-2 días |
| FASE 5: Historial | Media | 2-3 días |
| FASE 6: Notificaciones | Baja | 1-2 días |
| **Total** | | **12-18 días** |

---

## Archivos a Crear/Modificar

### Backend
```
packages/api/src/
├── api/routes/
│   ├── availability.ts           [NUEVO]
│   ├── slots.ts                  [NUEVO]
│   ├── patients.ts               [NUEVO]
│   └── notification-templates.ts [NUEVO]
├── services/business/
│   ├── availability.ts           [MODIFICAR]
│   ├── slot.ts                   [NUEVO]
│   └── patient.ts                [NUEVO]
└── inngest/functions/
    ├── reminders.ts              [COMPLETAR]
    └── slot-generation.ts        [COMPLETAR]
```

### Frontend
```
packages/web/src/
├── pages/dashboard/
│   ├── Availability.tsx          [NUEVO]
│   ├── Slots.tsx                 [NUEVO]
│   ├── Reservations.tsx          [MODIFICAR]
│   ├── PatientHistory.tsx        [NUEVO]
│   └── NotificationTemplates.tsx [NUEVO]
├── components/
│   ├── availability/             [NUEVO DIR]
│   │   ├── availability-rule-form.tsx
│   │   ├── availability-rules-list.tsx
│   │   └── availability-preview.tsx
│   ├── slots/                    [NUEVO DIR]
│   │   ├── slots-calendar.tsx
│   │   ├── slots-list.tsx
│   │   └── slot-actions-menu.tsx
│   ├── booking/                  [NUEVO DIR]
│   │   ├── booking-flow.tsx
│   │   ├── service-selector.tsx
│   │   ├── slot-calendar.tsx
│   │   ├── booking-form.tsx
│   │   └── booking-summary.tsx
│   ├── reservations/             [NUEVO DIR]
│   │   ├── reservations-list.tsx
│   │   ├── reservation-card.tsx
│   │   └── cancel-reservation-dialog.tsx
│   └── patients/                 [NUEVO DIR]
│       ├── patient-header.tsx
│       ├── patient-timeline.tsx
│       └── patient-notes.tsx
└── hooks/
    ├── use-availability-rules.ts [NUEVO]
    ├── use-slots.ts              [NUEVO]
    ├── use-booking.ts            [NUEVO]
    ├── use-reservations.ts       [MODIFICAR]
    ├── use-patient-history.ts    [NUEVO]
    └── use-notification-templates.ts [NUEVO]
```

---

## Próximos Pasos Inmediatos

**Sprint 1 (Fase 1 + 2): Configuración de Doctor**
1. Crear API de availability rules
2. Crear UI de availability rules
3. Crear API de slots management
4. Crear UI de slots management

**Sprint 2 (Fase 3): Booking para Pacientes**
1. Crear API pública de slots
2. Crear flujo de booking
3. Integrar con perfil público

**Sprint 3 (Fase 4 + 5): Gestión de Citas**
1. Completar UI de reservas
2. Crear historial de pacientes

**Sprint 4 (Fase 6): Notificaciones**
1. Completar workflows de Inngest
2. Crear editor de templates

---

## Notas Importantes

1. **Prioridad de WhatsApp**: El flujo actual es 100% WhatsApp. La UI de booking es para **futuro**.
2. **Migración de Datos**: Al crear availability rules, migrar slots existentes
3. **Testing**: Cada fase requiere pruebas de integración con Inngest
4. **Performance**: El calendario de slots debe manejar efficiently +1000 slots
5. **Validaciones**: Todas las validaciones deben estar en backend y frontend

---

**¿Por qué empezar con Fase 1?**
- Sin reglas de disponibilidad, no se pueden generar slots automáticamente
- Sin slots, no hay reservas
- Esta fase es el **bloqueador principal** del sistema completo
