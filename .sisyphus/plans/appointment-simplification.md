# Simplificación del Sistema de Citas Médicas

## TL;DR

> **Transformación de sistema basado en slots a flujo directo de solicitudes**
>
> El sistema actual utiliza slots predefinidos (6 estados, generación automática, validaciones complejas de solapamiento). La nueva versión simplifica a: **Paciente solicita fecha/hora preferida → Doctor decide (aprobar/rechazar/proponer reprogramación)**.
>
> **Cambios Clave (corregidos):**
>
> - Mantener tabla `time_slot` en BD por deprecación, pero **eliminar su uso funcional** en API, servicios, AI, frontend, Inngest y seeders
> - Simplificar `reservation_request` (sin `slotId`, con `preferredAtUtc`, `requestedTimezone`, `metadata`)
> - Simplificar `reservation` (sin `slotId`, con `scheduledAtUtc`, `scheduledTimezone`, `rescheduledFrom`)
> - Mantener `availability_rule` como horario informativo con validación estricta (incluyendo `isActive`, `effectiveFrom/effectiveTo`)
> - Definir flujo de reprogramación consistente con estados válidos (`counter_proposed`)
> - Agregar protección de concurrencia en aprobación (transacción + índice único)
>
> **Deliverables:**
>
> - Esquema de BD refactorizado (2 tablas modificadas + 1 columna en profile + índices/constraints)
> - API simplificada y completa en `/reservations/*` **y** `/public/*` (flujo paciente)
> - AI tools actualizados (sin slots)
> - Dashboard de doctor rediseñado (gestión de pendientes + propuesta de reprogramación)
> - Formulario público simplificado (fecha/hora preferida + timezone + metadata)
> - Inngest/events/seeders/templates alineados al nuevo modelo
>
> **Estimated Effort:** Large (4-5 días)
> **Parallel Execution:** YES - 6 waves
> **Critical Path:** Schema changes → API (reservations+public) → Business/Inngest → Frontend → Testing

---

## Context

### Original Request

Simplificar el sistema actual de citas médicas que usa slots predefinidos porque:

1. Los doctores tienen dificultades configurando y generando slots
2. La IA no puede operar rápidamente debido a múltiples procesos intermedios (generar slots, verificar disponibilidad, cambiar estados)
3. El sistema es propenso a fallos y complejo de mantener

### Scope References

- Módulo base: `docs/modules/11-citas-medicas.md`
- Estado de implementación actual: `docs/modules/11-citas-medicas-IMPLEMENTACION.md`

### Interview Summary

**Key Decisions Confirmed:**

- **Horario informativo:** Mantener `availability_rule` como referencia de horarios de atención (no eliminar completamente)
- **Metadata:** Campos predefinidos (estructura JSONB fija) para que la IA sepa qué recolectar
- **Validación:** Solo permitir solicitudes dentro del horario de atención definido (validación estricta)
- **Migración:** No hay datos existentes que migrar, pero refactorizar seeders

**Metis Review Findings (Addressed in Plan):**

- **Metadata Schema:** Definir estructura exacta (symptoms, urgencyLevel, isNewPatient, insuranceProvider, notes)
- **Timezone Handling:** Guardar `preferredAtUtc/scheduledAtUtc` en UTC + capturar timezone IANA (`requestedTimezone/scheduledTimezone`) para render correcto
- **Reschedule Flow:** Doctor puede proponer fecha/hora alternativa al rechazar o mediante endpoint específico de reprogramación
- **Validation Edge Cases:** Manejar múltiples reglas de disponibilidad, horarios de almuerzo, duración de consulta
- **Reminder System:** Recalcular recordatorios (24h, 2h) basado en `scheduledAtUtc` de la cita confirmada
- **Race Conditions:** Prevenir aprobación duplicada con índice único + transacción en aprobación

---

## Work Objectives

### Core Objective

Transformar el sistema de citas de un modelo complejo basado en slots predefinidos a un flujo directo de solicitudes, reduciendo la complejidad para doctores y permitiendo operación más ágil de la IA.

### Concrete Deliverables

**Database Schema:**

1. Modificar `reservation_request`: eliminar `slotId`, agregar `preferredAtUtc` (timestamp UTC), `requestedTimezone` (varchar 64), `metadata` (jsonb), `proposedAtUtc` (nullable), `proposalReason` (nullable), `proposalExpiresAt` (nullable)
2. Modificar `reservation`: eliminar `slotId`, agregar `scheduledAtUtc` (timestamp UTC), `scheduledTimezone` (varchar 64), `rescheduledFrom` (uuid nullable, references reservation.id)
3. Modificar enum de `reservation_request.status`: agregar `counter_proposed` (propuesta enviada al paciente)
4. Agregar `profile.timezone` (varchar 64, default "America/Lima") como fuente canónica para validaciones y notificaciones
5. Mantener tabla `time_slot` en BD (soft deprecation), pero sin dependencias activas en código de negocio
6. Actualizar índices/constraints:
   - `reservation_request(profile_id, preferred_at_utc)`
   - `reservation(profile_id, scheduled_at_utc)`
   - índice único parcial para evitar doble aprobación en mismo horario (reservations activas)

**API Layer:**

1. Eliminar rutas `/slots/*` completamente
2. Simplificar `/reservations/request` POST (sin slotId, con `preferredDate`, `preferredTime`, `timezone`, `metadata`)
3. Actualizar `/reservations/approve` POST (acepta `scheduledDate`, `scheduledTime`, `timezone`; convierte a `scheduledAtUtc`; valida disponibilidad)
4. Reprogramación explícita:
   - `POST /reservations/reschedule/propose` (doctor propone nueva fecha/hora)
   - `POST /reservations/reschedule/respond` (paciente acepta/rechaza propuesta)
5. Actualizar `/reservations/reject` POST (acepta `rejectionReason`)
6. Actualizar flujo público:
   - `POST /public/:username/booking` para nuevo body sin slots
   - Eliminar `GET /public/profiles/:username/slots/:serviceId`
   - Agregar `GET /public/profiles/:username/availability` (horario informativo)

**Business Services:**

1. Refactorizar `ReservationRequestService`: eliminar dependencia de TimeSlotRepository, agregar validación contra availability_rule
2. Crear `AvailabilityValidationService`: validar fecha/hora considerando timezone + reglas activas/effective range
3. Simplificar `ApprovalService`: eliminar lógica de estados de slot, aprobar directamente creando reservation con transacción
4. Actualizar `NotificationService`: usar `preferredAtUtc/scheduledAtUtc` + timezone
5. Registrar nuevos servicios en DI (`plugins/services.ts`)

**AI Tools:**

1. Eliminar `checkAvailabilityTool` (ya no hay slots para verificar)
2. Simplificar `createReservationTool`: aceptar `preferredDate`, `preferredTime`, `timezone` en lugar de slotId
3. Actualizar parámetros de metadata con estructura Zod predefinida
4. Actualizar schemas/config de chat UI para eliminar `slotId` de parts y payloads

**Frontend:**

1. Eliminar componentes de slots (`slots-list`, `slot-card`, `slot-generator-panel`, etc.)
2. Actualizar página `/dashboard/reservations`: lista de solicitudes pendientes con acciones aprobar/rechazar/reprogramar
3. Simplificar formulario de booking: calendario + selector de hora + selector/hidden timezone + metadata
4. Actualizar hooks de React Query para nueva API (`reservations` + `public booking`)
5. Eliminar navegación/ruta de slots del dashboard y actualizar availability UI para dejar de depender de generación de slots

**Infrastructure:**

1. Actualizar seeders: eliminar dependencias funcionales de slots, crear solicitudes/reservas directamente con UTC+timezone
2. Actualizar workflows Inngest completos (`types/events`, `functions/index`, `request-expiration`, `reminders`, `reservation-confirmation`) para usar `preferredAtUtc/scheduledAtUtc`
3. Actualizar templates de WhatsApp: eliminar referencias a "slot", usar fecha/hora directa

### Definition of Done

- [ ] Todas las pruebas E2E pasan (`packages/web/tests/e2e/reservations/*`)
- [ ] AI puede crear solicitudes de cita sin referencias a slots
- [ ] Doctor puede ver, aprobar, rechazar y reprogramar solicitudes desde dashboard
- [ ] Paciente puede aceptar/rechazar propuesta de reprogramación
- [ ] Validación de horario funciona correctamente (rechaza fuera de horario, acepta dentro)
- [ ] Conversión timezone↔UTC validada (sin desplazamientos incorrectos)
- [ ] Metadata se recolecta y almacena correctamente
- [ ] Recordatorios se envían correctamente (24h y 2h antes de la cita)
- [ ] Seeders ejecutan sin errores y crean datos de prueba válidos

### Must Have

- ✅ Sistema de solicitud directa (sin slots)
- ✅ Validación estricta contra availability_rule
- ✅ Estructura metadata predefinida para IA
- ✅ Flujo aprobar/rechazar/reprogramar funcional
- ✅ Reprogramación con estado válido y respuesta del paciente
- ✅ Notificaciones WhatsApp actualizadas
- ✅ Recordatorios automáticos (24h, 2h)
- ✅ Dashboard funcional para doctores
- ✅ Flujo público (`/public/:username/booking`) funcionando sin slots

### Must NOT Have (Guardrails from Metis)

- ❌ NO construir calendario UI complejo (solo selectores simples)
- ❌ NO implementar preview de disponibilidad en tiempo real
- ❌ NO agregar citas recurrentes
- ❌ NO agregar lista de espera (waiting list)
- ❌ NO agregar integración de pagos
- ❌ NO eliminar tabla time_slot físicamente en esta fase (soft deprecation)
- ❌ NO permitir solicitudes sin validación de horario
- ❌ NO usar estructura metadata dinámica (debe ser predefinida)

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Vitest + Playwright)
- **Automated tests**: YES - Tests-after (este es refactor, comportamiento debe mantenerse)
- **Framework**: bun test (API) + Playwright (E2E)

### Agent-Executed QA Scenarios

**Escenario 1: Paciente crea solicitud válida**

```
Tool: Playwright
Preconditions: Doctor tiene availability_rule: Lunes-Viernes 9:00-17:00
Steps:
  1. Navigate to: /dr-garcia/booking
  2. Select service: "Consulta General"
  3. Click date picker, select próximo martes
  4. Enter time: "10:00"
  5. Timezone enviada: "America/Lima"
  6. Fill patient name: "Juan Pérez"
  7. Fill phone: "+51999123456"
  8. Fill metadata/symptoms: "Dolor de cabeza"
  9. Click "Solicitar Cita"
  10. Assert: Redirect to confirmation page
  11. Assert: Message "Solicitud enviada correctamente"
  12. Assert API/DB: request guarda preferredAtUtc + requestedTimezone
  13. Screenshot: .sisyphus/evidence/valid-request.png
Expected Result: Solicitud creada con status "pending"
Evidence: .sisyphus/evidence/valid-request.png
```

**Escenario 2: Validación rechaza horario fuera de atención**

```
Tool: Playwright
Preconditions: Doctor atiende Lunes-Viernes 9:00-17:00
Steps:
  1. Navigate to: /dr-garcia/booking
  2. Select date: próximo sábado
  3. Enter time: "10:00"
  4. Click "Solicitar Cita"
  5. Assert: Error message visible
  6. Assert: Message contains "fuera del horario de atención"
  7. Screenshot: .sisyphus/evidence/invalid-time-rejected.png
Expected Result: Solicitud rechazada con mensaje claro
Evidence: .sisyphus/evidence/invalid-time-rejected.png
```

**Escenario 3: Doctor aprueba solicitud**

```
Tool: Playwright
Preconditions: Existe solicitud pendiente de "Juan Pérez" para martes 10:00
Steps:
  1. Login as doctor
  2. Navigate to: /dashboard/reservations
  3. Wait for: List contains "Juan Pérez"
  4. Click: "Ver Detalle" on Juan Pérez request
  5. Assert: Modal shows patient details and symptoms
  6. Click: "Aprobar Cita"
  7. Confirm scheduledDate: martes, scheduledTime: 10:00, timezone: "America/Lima"
  8. Click: "Confirmar"
  9. Assert: Success toast "Cita aprobada correctamente"
  10. Assert: Request status changed to "approved"
  11. Assert: Reservation creada con scheduledAtUtc + scheduledTimezone
  12. Screenshot: .sisyphus/evidence/approve-request.png
Expected Result: Cita aprobada y reservation creada
Evidence: .sisyphus/evidence/approve-request.png
```

**Escenario 4: Doctor propone reprogramación**

```
Tool: Playwright
Preconditions: Existe solicitud pendiente para martes 10:00
Steps:
  1. Navigate to: /dashboard/reservations
  2. Click: "Reprogramar" on pending request
  3. Select new date: miércoles
  4. Enter new time: "14:00"
  5. Add note: "Mejor horario para el paciente"
  6. Click: "Enviar Propuesta"
  7. Assert: Status changed to "counter_proposed"
  8. Assert: Patient receives WhatsApp notification
  9. Screenshot: .sisyphus/evidence/reschedule-request.png
Expected Result: Solicitud queda en propuesta de reprogramación pendiente de respuesta del paciente
Evidence: .sisyphus/evidence/reschedule-request.png
```

**Escenario 5: Paciente acepta propuesta de reprogramación**

```
Tool: Playwright
Preconditions: Existe solicitud en estado "counter_proposed"
Steps:
  1. Navegar al link de estado de solicitud del paciente
  2. Click: "Aceptar nueva fecha/hora"
  3. Assert: Estado final "approved" y reservation creada
  4. Assert: Notificación de confirmación enviada
Expected Result: Propuesta aceptada y cita confirmada
Evidence: .sisyphus/evidence/reschedule-accepted.png
```

**Escenario 6: API validación de disponibilidad**

```
Tool: Bash (curl)
Preconditions: Server running, doctor profile exists with availability Lunes-Viernes 9-17
Steps:
  1. POST /api/reservations/request
     Body: {"profileId": "doc-123", "serviceId": "srv-456", "preferredDate": "2026-02-10", "preferredTime": "10:00", "timezone":"America/Lima", "patientName": "Test", "patientPhone": "+51999000000"}
  2. Assert: Status 201
  3. Assert: Response contains requestId
  4. POST /api/reservations/request (domingo - fuera de horario)
     Body: {"profileId": "doc-123", "serviceId": "srv-456", "preferredDate": "2026-02-15", "preferredTime": "10:00", "timezone":"America/Lima", ...}
  5. Assert: Status 400
  6. Assert: Response.error contains "fuera del horario"
  7. Assert: UTC conversion is deterministic for accepted request
  8. Save responses to: .sisyphus/evidence/api-validation.json
Expected Result: Validación correcta de horario
Evidence: .sisyphus/evidence/api-validation.json
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Database & Core Schema):
├── Task 1: Modificar reservation-request schema
├── Task 2: Modificar reservation schema
└── Task 3: Crear AvailabilityValidationService

Wave 2 (API Layer - Depends on Wave 1):
├── Task 4: Eliminar slots routes
├── Task 5: Refactorizar reservations routes
└── Task 6: Actualizar AI tools

Wave 3 (Business Logic - Depends on Wave 1):
├── Task 7: Refactorizar ReservationRequestService
├── Task 8: Simplificar ApprovalService
└── Task 9: Actualizar NotificationService

Wave 4 (Frontend - Depends on Wave 2):
├── Task 10: Eliminar componentes de slots
├── Task 11: Actualizar dashboard de reservas
└── Task 12: Simplificar formulario de booking

Wave 5 (Infrastructure & Testing):
├── Task 13: Actualizar seeders
├── Task 14: Actualizar workflows Inngest
└── Task 15: Actualizar templates WhatsApp

Wave 6 (Final Integration):
├── Task 16: Ejecutar tests E2E
└── Task 17: Cleanup y documentación

Critical Path: Task 1 → Task 2 → Task 5 → Task 11 → Task 16
```

---

## TODOs

### Task 1: Modificar Schema reservation-request

**What to do:**

- Eliminar columna `slotId` (uuid, foreign key)
- Agregar columna `preferredAtUtc` (timestamp UTC, not null)
- Agregar columna `requestedTimezone` (varchar(64), not null, default `"America/Lima"`)
- Agregar columna `metadata` (jsonb, nullable)
- Agregar campos de propuesta de reprogramación:
  - `proposedAtUtc` (timestamp UTC, nullable)
  - `proposalReason` (text, nullable)
  - `proposalExpiresAt` (timestamp UTC, nullable)
- Actualizar enum `requestStatus` para incluir `counter_proposed`
- Actualizar índices: eliminar `idx_request_slot_id`, agregar `idx_request_preferred_at_utc`

**Must NOT do:**

- NO eliminar tabla time_slot aún (soft deprecation)
- NO modificar otras columnas existentes (patientName, patientPhone, etc.)

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)
- **Reason**: Cambio de schema Drizzle directo y simple

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 5, Task 7
- **Blocked By**: None

**References:**

- **Pattern**: `packages/api/src/db/schema/reservation-request.ts` - Ver estructura actual
- **Pattern**: `packages/api/src/db/schema/availability-rule.ts` - Relación con validación temporal
- **API/Type**: Nuevos campos deben integrarse con tipos TypeScript

**Acceptance Criteria:**

- [ ] Migración generada: `bunx drizzle-kit generate --config drizzle.config.ts`
- [ ] Tipos TypeScript actualizados: `NewReservationRequest` incluye nuevos campos
- [ ] Índice `idx_request_preferred_at_utc` creado
- [ ] Enum `requestStatus` incluye `counter_proposed`

**Agent-Executed QA:**

```
Scenario: Schema migration succeeds
  Tool: Bash
  Steps:
    1. Run: cd packages/api && bunx drizzle-kit generate --config drizzle.config.ts
    2. Assert: Migration file created in migrations/
    3. Assert: File contains ALTER TABLE para nuevas columnas
    4. Run: bunx drizzle-kit push --config drizzle.config.ts
    5. Assert: Exit code 0
  Evidence: migration output log
```

**Commit**: YES

- Message: `refactor(db): simplify reservation_request schema - remove slotId, add preferredAtUtc/requestedTimezone/metadata`
- Files: `packages/api/src/db/schema/reservation-request.ts`, `migrations/*.sql`

---

### Task 2: Modificar Schema reservation

**What to do:**

- Eliminar columna `slotId` (uuid, foreign key)
- Agregar columna `scheduledAtUtc` (timestamp UTC, not null)
- Agregar columna `scheduledTimezone` (varchar(64), not null, default `"America/Lima"`)
- Agregar columna `rescheduledFrom` (uuid, nullable, references reservation.id)
- Actualizar índices: eliminar `idx_reservation_slot_id`, agregar `idx_reservation_scheduled_at_utc`
- Agregar índice único parcial para evitar doble aprobación (mismo doctor + mismo horario en citas activas)
- Agregar `profile.timezone` (varchar(64), not null, default `"America/Lima"`) como fuente canónica

**Must NOT do:**

- NO eliminar otras columnas (reminder flags, payment status, etc.)
- NO cambiar comportamiento de reservationStatus

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES (con Task 1)
- **Parallel Group**: Wave 1
- **Blocks**: Task 8, Task 9
- **Blocked By**: None

**References:**

- **Pattern**: `packages/api/src/db/schema/reservation.ts` - Estructura actual
- **API/Type**: Mantener compatibilidad con tipos existentes donde sea posible

**Acceptance Criteria:**

- [ ] Migración generada exitosamente
- [ ] Tipos actualizados: `NewReservation` y `Reservation` incluyen `scheduledAtUtc/scheduledTimezone`
- [ ] `profile.timezone` disponible para validaciones y notificaciones
- [ ] Índice único parcial implementado para conflictos de aprobación

**Agent-Executed QA:**

```
Scenario: Reservation schema updated
  Tool: Bash
  Steps:
    1. Run: bunx drizzle-kit generate --config drizzle.config.ts
    2. Assert: Migration includes scheduledAtUtc/scheduledTimezone columns
    3. Run: bun run lint
    4. Assert: No TypeScript errors in schema files
  Evidence: lint output
```

**Commit**: YES (agrupado con Task 1)

---

### Task 3: Crear AvailabilityValidationService

**What to do:**

- Crear nuevo servicio: `packages/api/src/services/business/availability-validation.ts`
- Implementar método `validateAgainstRules(profileId, localDate, localTime, timezone, duration?)`
- Verificar si fecha/hora cae dentro de availability_rules del doctor según timezone
- Manejar múltiples reglas por día (ej: 9-12 y 14-17)
- Retornar `{ valid: boolean, reason?: string }`

**Must NOT do:**

- NO depender de `time_slot` para validación de solicitud
- NO implementar lógica de duración compleja (fase 1: validar solo hora inicio)

**Lógica de validación:**

```typescript
// Pseudocódigo
1. Obtener timezone efectivo del doctor (profile.timezone)
2. Convertir localDate/localTime (timezone del request) a hora local del doctor
3. Obtener availability_rules activas para profileId + dayOfWeek
4. Filtrar reglas por isActive y effectiveFrom/effectiveTo
5. Para cada regla:
   - Si time >= regla.startTime AND time < regla.endTime → válido
6. Si ninguna regla coincide → return { valid: false, reason: "Fuera del horario de atención" }
```

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 5, Task 7
- **Blocked By**: None (usa availability_rule table existente)

**References:**

- **Pattern**: `packages/api/src/db/schema/availability-rule.ts` - Estructura de reglas
- **Pattern**: `packages/api/src/services/business/slot.ts` - Ejemplo de servicio de validación
- **API/Type**: `AvailabilityRule` type

**Acceptance Criteria:**

- [ ] Servicio creado y exportado
- [ ] Método validateAgainstRules implementado
- [ ] Maneja múltiples reglas por día
- [ ] Retorna mensajes de error en español
- [ ] Tests unitarios pasan

**Agent-Executed QA:**

```
Scenario: Validation service works correctly
  Tool: Bash (bun test)
  Steps:
    1. Create test: doctor with availability Mon-Fri 9:00-17:00
    2. Test: validate 10:00 Monday → expect valid: true
    3. Test: validate 10:00 Saturday → expect valid: false
    4. Test: validate 18:00 Monday → expect valid: false
    5. Run: bun test availability-validation.test.ts
    6. Assert: All tests pass
  Evidence: test output
```

**Commit**: YES

- Message: `feat(api): add AvailabilityValidationService for business hours validation`
- Files: `packages/api/src/services/business/availability-validation.ts`, tests

---

### Task 4: Eliminar Slots Routes

**What to do:**

- Eliminar archivo: `packages/api/src/api/routes/slots.ts`
- Remover import de slotsRoutes en `packages/api/src/index.ts`
- Eliminar `SlotService` y uso funcional de `TimeSlotRepository` en flujo de citas

**Must NOT do:**

- NO eliminar time_slot table de BD aún (soft deprecation)
- NO eliminar archivos de schema aún

**Verificar referencias antes de eliminar:**

```bash
grep -r "slotsRoutes\|SlotService\|TimeSlotRepository" packages/api/src --include="*.ts" | grep -v ".test.ts"
```

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: NO (esperar Wave 1)
- **Parallel Group**: Wave 2
- **Blocks**: N/A
- **Blocked By**: Task 1, Task 2 (para asegurar que nada depende de slots)

**References:**

- **Pattern**: `packages/api/src/index.ts` - Ver cómo se registran rutas
- **Pattern**: `packages/api/src/api/routes/slots.ts` - Rutas a eliminar

**Acceptance Criteria:**

- [ ] Archivo slots.ts eliminado
- [ ] Import removido de index.ts
- [ ] No hay referencias restantes a slotsRoutes
- [ ] API compila sin errores: `bun run build` exitoso

**Agent-Executed QA:**

```
Scenario: API compiles without slots
  Tool: Bash
  Steps:
    1. Run: bun run build
    2. Assert: No compilation errors
    3. Run: bun run dev (start server)
    4. Assert: Server starts successfully
    5. Test: curl http://localhost:5300/api/health
    6. Assert: Returns 200 OK
  Evidence: build output, server logs
```

**Commit**: YES

- Message: `refactor(api): remove slots routes - appointment system simplified`
- Files: `packages/api/src/api/routes/slots.ts`, `packages/api/src/index.ts`

---

### Task 5: Refactorizar Reservations Routes

**What to do:**

- Actualizar `packages/api/src/api/routes/reservations.ts`
- Modificar POST `/request`:
  - Eliminar validación de `slotId`
  - Aceptar `preferredDate`, `preferredTime`, `timezone`, `metadata` en body
  - Convertir a `preferredAtUtc` y validar contra availability_rule
- Modificar POST `/approve`:
  - Cambiar para usar `scheduledDate`, `scheduledTime`, `timezone` (sin slotId)
  - Convertir a `scheduledAtUtc`
  - Validar conflicto y persistir dentro de transacción
- Crear `POST /reschedule/propose`:
  - Aceptar `requestId`, `newDate`, `newTime`, `timezone`, `reason`
  - Actualizar request a `counter_proposed` con `proposedAtUtc`
  - Notificar paciente
- Crear `POST /reschedule/respond`:
  - Aceptar `requestId`, `decision` (`accept` | `reject`)
  - Si accept: aprobar con `scheduledAtUtc = proposedAtUtc`
  - Si reject: volver a `pending`
- Modificar POST `/reject`:
  - Aceptar `rejectionReason` y rechazar sin mezclar flujo de propuesta
- Actualizar `packages/api/src/api/routes/public.ts`:
  - Eliminar endpoint público de slots
  - Actualizar `POST /public/:username/booking` al nuevo contrato sin slots
  - Agregar endpoint de horario informativo (availability rules)

**Must NOT do:**

- NO mantener parámetros de slot en APIs
- NO permitir aprobación sin fecha/hora confirmada

**Estructura de endpoints final:**

```typescript
POST   /reservations/request        // Crear solicitud
GET    /reservations/pending/:profileId  // Ver pendientes
GET    /reservations/request/:id    // Ver detalle
POST   /reservations/approve        // Aprobar solicitud
POST   /reservations/reject         // Rechazar solicitud
POST   /reservations/reschedule/propose // Proponer reprogramación
POST   /reservations/reschedule/respond // Paciente responde propuesta
GET    /reservations/patient/:phone // Historial paciente
GET    /reservations/stats/:profileId  // Estadísticas
POST   /public/:username/booking    // Solicitud pública sin slotId
```

**Recommended Agent Profile:**

- **Category**: `unspecified-medium`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 2
- **Blocks**: Task 11, Task 12
- **Blocked By**: Task 1, Task 2, Task 3, Task 4

**References:**

- **Pattern**: `packages/api/src/api/routes/reservations.ts` - Implementación actual
- **Pattern**: `packages/api/src/services/business/reservation-request.ts` - Servicio a integrar
- **API/Type**: Elysia t.Object validation

**Acceptance Criteria:**

- [ ] POST /request usa preferredDate/Time/timezone y valida contra availability
- [ ] POST /approve crea reservation con scheduledAtUtc/scheduledTimezone
- [ ] POST /reschedule/propose y /respond implementados y funcionales
- [ ] POST /public/:username/booking usa contrato nuevo sin slotId
- [ ] Todos los endpoints retornan códigos HTTP correctos
- [ ] Validaciones Zod/Elysia funcionan

**Agent-Executed QA:**

```
Scenario: Reservation endpoints work end-to-end
  Tool: Bash (curl)
  Preconditions: Server running, doctor profile exists with availability
  Steps:
    1. POST /api/reservations/request (valid time)
       Assert: 201 Created, returns request object
    2. POST /api/reservations/request (invalid time - domingo)
       Assert: 400 Bad Request
    3. GET /api/reservations/pending/:profileId
       Assert: 200, contains created request
    4. POST /api/reservations/approve
       Assert: 200, creates reservation
    5. POST /api/reservations/reschedule/propose
       Assert: 200, status is "counter_proposed"
    6. POST /api/reservations/reschedule/respond (accept)
       Assert: 200, status is "approved"
    7. POST /api/public/:username/booking
       Assert: 201, body does not require slotId
  Evidence: curl responses saved
```

**Commit**: YES

- Message: `refactor(api): update reservations routes - slotless appointment system`
- Files: `packages/api/src/api/routes/reservations.ts`

---

### Task 6: Actualizar AI Tools

**What to do:**

- Eliminar `checkAvailabilityTool` de `packages/api/src/services/ai/chat/tools/appointments.ts`
- Modificar `createReservationTool`:
  - Eliminar parámetro slotId
  - Agregar parámetros preferredDate, preferredTime, timezone
  - Agregar parámetro metadata con estructura Zod predefinida
- Actualizar schema de metadata:

```typescript
const metadataSchema = z.object({
  symptoms: z
    .array(z.string())
    .optional()
    .describe("Síntomas reportados por el paciente"),
  urgencyLevel: z.enum(["low", "normal", "high", "urgent"]).optional(),
  isNewPatient: z.boolean().optional().describe("True si es paciente nuevo"),
  insuranceProvider: z
    .string()
    .optional()
    .describe("Aseguradora/seguro médico"),
  notes: z.string().optional().describe("Notas adicionales"),
});
```

- Actualizar descripción de herramientas para IA

**Must NOT do:**

- NO mantener herramientas que dependan de slots
- NO usar estructura metadata dinámica

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES (con Task 5)
- **Parallel Group**: Wave 2
- **Blocks**: N/A
- **Blocked By**: Task 1, Task 2

**References:**

- **Pattern**: `packages/api/src/services/ai/chat/tools/appointments.ts` - Herramientas actuales
- **Pattern**: `packages/api/src/services/ai/chat/config.ts` - Configuración de herramientas
- **API/Type**: VoltAgent tool creation pattern

**Acceptance Criteria:**

- [ ] checkAvailabilityTool eliminado
- [ ] createReservationTool usa preferredDate/Time/timezone
- [ ] Estructura metadata definida con Zod
- [ ] Descripciones actualizadas para contexto de IA
- [ ] Herramientas exportadas correctamente
- [ ] `packages/api/src/services/ai/chat/schema.ts` no contiene `slotId` en patient-form
- [ ] `packages/api/src/services/ai/chat/config.ts` elimina ejemplos con `slotId`

**Agent-Executed QA:**

```
Scenario: AI tools work with new schema
  Tool: Bash (curl para probar API que usa herramientas)
  Steps:
    1. Start server
    2. Test create_reservation tool via API endpoint
    3. Assert: Tool accepts preferredDate/Time/timezone, not slotId
    4. Assert: Tool accepts metadata with all fields
    5. Assert: Returns success response
  Evidence: API responses
```

**Commit**: YES (agrupado con Task 5)

---

### Task 7: Refactorizar ReservationRequestService

**What to do:**

- Actualizar `packages/api/src/services/business/reservation-request.ts`
- Eliminar dependencia de TimeSlotRepository
- Inyectar AvailabilityValidationService
- Modificar `createRequest()`:
  - Aceptar `preferredDate/preferredTime/timezone` en lugar de slotId
  - Validar contra availability_rule usando AvailabilityValidationService
  - Convertir y guardar `preferredAtUtc` + `requestedTimezone`
  - Guardar metadata
  - No validar solapamiento (eso pasa en aprobación)
- Mantener métodos de consulta (getPendingRequests, etc.) pero adaptar a nuevo schema
- Registrar `AvailabilityValidationService` en `packages/api/src/plugins/services.ts`

**Must NOT do:**

- NO usar TimeSlotRepository
- NO validar solapamiento en creación (solo validar horario de atención)

**Recommended Agent Profile:**

- **Category**: `unspecified-medium`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES (con Wave 2)
- **Parallel Group**: Wave 3
- **Blocks**: N/A
- **Blocked By**: Task 1, Task 3

**References:**

- **Pattern**: `packages/api/src/services/business/reservation-request.ts` - Servicio actual
- **Pattern**: `packages/api/src/services/repository/reservation-request.ts` - Repository
- **API/Type**: Disponible después de Task 1

**Acceptance Criteria:**

- [ ] Servicio refactorizado sin TimeSlotRepository
- [ ] createRequest valida contra availability_rule
- [ ] createRequest persiste `preferredAtUtc/requestedTimezone`
- [ ] Métodos de consulta funcionan con nuevo schema
- [ ] Tests unitarios pasan

**Agent-Executed QA:**

```
Scenario: Service creates requests correctly
  Tool: Bash (bun test)
  Steps:
    1. Test: createRequest con horario válido → crea solicitud
    2. Test: createRequest con horario inválido → lanza error
    3. Test: getPendingRequests retorna solicitudes con preferredAtUtc/requestedTimezone
    4. Run: bun test reservation-request.test.ts
    5. Assert: All tests pass
  Evidence: test output
```

**Commit**: YES

- Message: `refactor(api): simplify ReservationRequestService - remove slot dependency`
- Files: `packages/api/src/services/business/reservation-request.ts`

---

### Task 8: Simplificar ApprovalService

**What to do:**

- Actualizar `packages/api/src/services/business/approval.ts`
- Eliminar lógica de manejo de estados de slot
- Modificar `approveRequest()`:
  - Crear reservation directamente (sin actualizar slot)
  - Aceptar `scheduledDate/scheduledTime/timezone` del doctor
  - Convertir a `scheduledAtUtc/scheduledTimezone`
  - Validar conflicto en transacción (mismo doctor/horario)
  - Actualizar request status a "approved"
- Agregar `proposeReschedule()`:
  - Guardar `proposedAtUtc`, `proposalReason`, `proposalExpiresAt`
  - Actualizar request status a `counter_proposed`
- Agregar `respondReschedule()`:
  - Si `accept`: aprobar solicitud con `scheduledAtUtc = proposedAtUtc`
  - Si `reject`: volver a `pending` y limpiar propuesta
- Modificar `rejectRequest()`:
  - Mantener rechazo definitivo con `rejectionReason`
- Eliminar métodos relacionados a slot state transitions

**Must NOT do:**

- NO interactuar con time_slot table
- NO implementar lógica compleja de "reserving" state

**Lógica de aprobación:**

```typescript
async approveRequest(requestId, doctorId, scheduledDate, scheduledTime, timezone) {
  1. Iniciar transacción
  2. Obtener request con lock FOR UPDATE
  3. Convertir fecha/hora local a scheduledAtUtc
  4. Verificar conflicto + constraint única parcial
  5. Crear reservation con scheduledAtUtc/scheduledTimezone
  6. Actualizar request.status = "approved"
  7. Enviar notificación al paciente
}
```

**Recommended Agent Profile:**

- **Category**: `unspecified-medium`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3
- **Blocks**: N/A
- **Blocked By**: Task 2

**References:**

- **Pattern**: `packages/api/src/services/business/approval.ts` - Servicio actual (si existe)
- **Pattern**: `packages/api/src/services/repository/reservation.ts` - Repository de reservations

**Acceptance Criteria:**

- [ ] approveRequest crea reservation sin usar slots
- [ ] Validación de conflictos + transacción + constraint única implementadas
- [ ] proposeReschedule y respondReschedule implementados
- [ ] rejectRequest maneja solo rechazo definitivo
- [ ] No queda código relacionado a slot states

**Agent-Executed QA:**

```
Scenario: Approval flow works end-to-end
  Tool: Bash (bun test)
  Steps:
    1. Test: approveRequest valid → creates reservation
    2. Test: approveRequest con conflicto → lanza error
    3. Test: proposeReschedule → status counter_proposed
    4. Test: respondReschedule(accept) → approved + reservation creada
    5. Test: rejectRequest → rejected con reason
    6. Run: bun test approval.test.ts
    7. Assert: All tests pass
  Evidence: test output
```

**Commit**: YES (agrupado con Task 7)

---

### Task 9: Actualizar NotificationService

**What to do:**

- Actualizar `packages/api/src/services/business/notification.ts`
- Modificar métodos de notificación para usar `preferredAtUtc/scheduledAtUtc` + timezone
- Actualizar templates:
  - `appointment_confirmed`: usar `scheduledAtUtc/scheduledTimezone`
  - `appointment_reminder_24h`: calcular tiempo desde `scheduledAtUtc`
  - `appointment_reminder_2h`: calcular tiempo desde `scheduledAtUtc`
- Agregar método `notifyReschedule()` para notificar reprogramación

**Must NOT do:**

- NO usar slot.startTime/endTime
- NO eliminar templates existentes, solo actualizar variables

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3
- **Blocks**: Task 14 (workflows)
- **Blocked By**: Task 2

**References:**

- **Pattern**: `packages/api/src/services/business/notification.ts` - Servicio actual
- **Pattern**: `packages/api/src/services/ai/whatsapp-agent/webhooks.ts` - Templates

**Acceptance Criteria:**

- [ ] Notificaciones usan `scheduledAtUtc/scheduledTimezone`
- [ ] Templates de WhatsApp actualizados
- [ ] Cálculo de recordatorios basado en nueva estructura

**Agent-Executed QA:**

```
Scenario: Notifications work with new schema
  Tool: Bash (test)
  Steps:
    1. Mock notification service
    2. Call notifyPatientApproval con scheduledAtUtc/scheduledTimezone
    3. Assert: Template variables contienen fecha/hora correcta
    4. Verify reminder calculation (24h before scheduled time)
  Evidence: test assertions
```

**Commit**: YES

- Message: `refactor(api): update NotificationService - use scheduled date/time`
- Files: `packages/api/src/services/business/notification.ts`

---

### Task 10: Eliminar Componentes de Slots (Frontend)

**What to do:**

- Eliminar archivos en `packages/web/src/components/slots/`:
  - slot-status-badge.tsx
  - slot-card.tsx
  - slots-list.tsx
  - slots-page.tsx
  - slot-preview-timeline.tsx
  - slot-generator-panel.tsx
- Eliminar hook `useSlots.ts`
- Eliminar ruta `dashboard.slots.tsx`
- Actualizar navegación: remover link a "Slots" del sidebar

**Must NOT do:**

- NO eliminar componentes reutilizables (Button, Card, etc.)
- NO modificar componentes de booking aún (Task 12)

**Verificar referencias:**

```bash
grep -r "SlotCard\|SlotsList\|useSlots" packages/web/src --include="*.tsx" --include="*.ts"
```

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: `frontend`

**Parallelization:**

- **Can Run In Parallel**: NO (esperar Wave 3)
- **Parallel Group**: Wave 4
- **Blocks**: N/A
- **Blocked By**: Task 5 (API debe estar lista)

**References:**

- **Pattern**: `packages/web/src/components/slots/` - Componentes a eliminar
- **Pattern**: `packages/web/src/routes/dashboard.slots.tsx` - Ruta a eliminar

**Acceptance Criteria:**

- [ ] Carpeta components/slots eliminada
- [ ] Hook useSlots eliminado
- [ ] Ruta dashboard.slots eliminada
- [ ] No hay imports rotos
- [ ] Build de web compila: `bun run build` exitoso

**Agent-Executed QA:**

```
Scenario: Frontend builds without slots
  Tool: Bash
  Steps:
    1. Run: cd packages/web && bun run build
    2. Assert: Build succeeds without errors
    3. Run: bun run lint
    4. Assert: No linting errors
  Evidence: build output
```

**Commit**: YES

- Message: `refactor(web): remove slot components - simplify appointment system`
- Files: `packages/web/src/components/slots/*`, `packages/web/src/hooks/use-slots.ts`, `packages/web/src/routes/dashboard.slots.tsx`

---

### Task 11: Actualizar Dashboard de Reservas

**What to do:**

- Actualizar `packages/web/src/routes/dashboard.reservations.tsx`
- Rediseñar UI para nuevo flujo:
  - Lista de solicitudes pendientes (nombre paciente, fecha/hora preferida, servicio)
  - Acciones: Ver detalle, Aprobar, Rechazar, Reprogramar
  - Modal de aprobación: muestra datos paciente, permite confirmar fecha/hora o modificar
  - Modal de rechazo: campo de motivo, opcional: sugerir nueva fecha/hora
- Usar React Query hooks actualizados para nueva API
- Implementar estados de carga y error

**Must NOT do:**

- NO usar componentes de slots
- NO implementar calendario complejo (usar selectores simples)

**UI Propuesta:**

```
┌─────────────────────────────────────────────────────┐
│ Solicitudes Pendientes (3)                          │
├─────────────────────────────────────────────────────┤
│ Juan Pérez              Martes 10:00    [Ver] [✓] [✗] │
│ Consulta General                                   │
├─────────────────────────────────────────────────────┤
│ María García            Miércoles 14:00 [Ver] [✓] [✗] │
│ Control de rutina                                  │
└─────────────────────────────────────────────────────┘
```

**Recommended Agent Profile:**

- **Category**: `visual-engineering`
- **Skills**: `frontend`

**Parallelization:**

- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 4
- **Blocks**: N/A
- **Blocked By**: Task 5, Task 7, Task 8

**References:**

- **Pattern**: `packages/web/src/routes/dashboard.reservations.tsx` - Ruta actual
- **Pattern**: `packages/web/src/components/ai-ui/reservation-part.tsx` - Ejemplo de card de reserva
- **API/Type**: Tipos de API actualizados desde packages/api

**Acceptance Criteria:**

- [ ] Lista de solicitudes pendientes muestra fecha/hora local derivada de `preferredAtUtc/requestedTimezone`
- [ ] Botones de acción funcionan (aprobar/rechazar/reprogramar)
- [ ] Modal de aprobación permite confirmar o modificar fecha/hora
- [ ] Datos del paciente visibles (nombre, teléfono, síntomas si hay)
- [ ] Flujo de propuesta usa estado `counter_proposed` y respuesta posterior
- [ ] Estados de carga y error manejados
- [ ] Responsive design funciona

**Agent-Executed QA:**

```
Scenario: Doctor can manage requests
  Tool: Playwright
  Preconditions: Doctor logged in, pending requests exist
  Steps:
    1. Navigate to /dashboard/reservations
    2. Wait for: List of pending requests visible
    3. Click: "Ver" on first request
    4. Assert: Modal shows patient details
    5. Click: "Aprobar"
    6. Assert: Confirmation modal opens
    7. Click: "Confirmar Cita"
    8. Assert: Success toast appears
    9. Assert: Request disappears from pending list
    10. Screenshot: .sisyphus/evidence/dashboard-approve.png
  Evidence: screenshots
```

**Commit**: YES

- Message: `feat(web): redesign reservations dashboard - slotless approval flow`
- Files: `packages/web/src/routes/dashboard.reservations.tsx`, componentes relacionados

---

### Task 12: Simplificar Formulario de Booking

**What to do:**

- Actualizar página de booking (`packages/web/src/routes/_public.$username.booking.tsx` o similar)
- Simplificar flujo:
  1. Seleccionar servicio
  2. Seleccionar fecha (DatePicker)
  3. Ingresar hora preferida (TimePicker o input)
  4. Detectar/capturar timezone IANA del navegador (editable)
  5. Formulario de datos del paciente (nombre, teléfono, email)
  6. Campos de metadata (síntomas, notas) - opcional
  7. Submit
- Eliminar selección de slots
- Mostrar horario de atención del doctor como referencia
- Validar que fecha/hora esté dentro del horario (usando API)
- Actualizar consumo de API pública y hooks:
  - `packages/web/src/hooks/use-booking.ts`
  - `packages/web/src/components/booking/booking-flow.tsx`
  - `packages/api/src/api/routes/public.ts` (contrato sin slotId)

**Must NOT do:**

- NO mostrar calendario con disponibilidad visual
- NO implementar selección de slots
- NO hacer validación compleja en frontend (dejarlo a la API)

**UI Propuesta:**

```
┌──────────────────────────────────────┐
│ Agendar Cita con Dr. García          │
├──────────────────────────────────────┤
│ Servicio: [Consulta General ▼]       │
│                                      │
│ Horario de atención:                 │
│ Lun-Vie: 9:00 - 17:00                │
│                                      │
│ Fecha preferida: [📅 Calendario]     │
│ Hora preferida: [🕐 10:00    ]       │
│                                      │
│ Tus datos:                           │
│ Nombre: [Juan Pérez        ]         │
│ Teléfono: [+51 999 123 456 ]         │
│ Email: [juan@email.com     ]         │
│                                      │
│ Motivo de consulta:                  │
│ [Tengo dolor de cabeza...  ]         │
│                                      │
│ [Solicitar Cita]                     │
└──────────────────────────────────────┘
```

**Recommended Agent Profile:**

- **Category**: `visual-engineering`
- **Skills**: `frontend`

**Parallelization:**

- **Can Run In Parallel**: YES (con Task 11)
- **Parallel Group**: Wave 4
- **Blocks**: N/A
- **Blocked By**: Task 5

**References:**

- **Pattern**: `packages/web/src/routes/_public.$username.booking.tsx` - Booking actual
- **Pattern**: `packages/web/src/components/booking/slot-calendar.tsx` - Componente a eliminar/reemplazar
- **API/Type**: Nuevo endpoint POST /reservations/request

**Acceptance Criteria:**

- [ ] Formulario usa DatePicker + TimePicker (no slots)
- [ ] Muestra horario de atención del doctor
- [ ] Envía preferredDate/preferredTime/timezone en lugar de slotId
- [ ] Incluye campos de metadata
- [ ] Maneja errores de validación (hora fuera de atención)
- [ ] Responsive y accesible

**Agent-Executed QA:**

```
Scenario: Patient can book appointment
  Tool: Playwright
  Preconditions: Server running, doctor profile exists
  Steps:
    1. Navigate to /dr-garcia/booking
    2. Select service: "Consulta General"
    3. Verify: Business hours displayed
    4. Select date: next Tuesday
    5. Enter time: "10:00"
    6. Fill patient data
    7. Fill symptoms: "Dolor de cabeza"
    8. Click: "Solicitar Cita"
    9. Assert: Success page shown
    10. Assert: Confirmation message visible
    11. Screenshot: .sisyphus/evidence/booking-success.png
  Evidence: screenshots
```

**Commit**: YES

- Message: `feat(web): simplify booking flow - remove slot selection`
- Files: `packages/web/src/routes/_public.$username.booking.tsx`, componentes relacionados

---

### Task 13: Actualizar Seeders

**What to do:**

- Refactorizar `packages/api/src/db/seeders/reservation-requests.seeder.ts`
- Refactorizar `packages/api/src/db/seeders/reservations.seeder.ts`
- Eliminar dependencia funcional de `packages/api/src/db/seeders/time-slots.seeder.ts`
- Actualizar `packages/api/src/db/seed.ts` (hoy recrea tablas con `slot_id` y `time_slot`)
- Nuevo enfoque:
  - Crear availability_rules para doctores
  - Crear reservation_requests directamente (con `preferredAtUtc/requestedTimezone`)
  - Crear reservations directamente (con `scheduledAtUtc/scheduledTimezone`)
  - No poblar time_slots para flujo de citas

**Datos de seed propuestos:**

- 3 doctores con availability_rules (Lunes-Viernes 9-17)
- Cada doctor: 5-10 reservation_requests (mix de pending, approved, rejected)
- Cada doctor: 3-5 reservations confirmed
- Metadata variado en requests

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 5
- **Blocks**: N/A
- **Blocked By**: Task 1, Task 2 (schema debe estar listo)

**References:**

- **Pattern**: `packages/api/src/db/seeders/` - Seeders existentes
- **API/Type**: Nuevos schemas de reservation_request y reservation

**Acceptance Criteria:**

- [ ] Seeders crean datos válidos con nuevo schema
- [ ] No dependencias funcionales a `time_slot` en seed de citas
- [ ] Datos variados para testing
- [ ] `bun run --cwd packages/api db:seed` ejecuta sin errores

**Agent-Executed QA:**

```
Scenario: Seeders work correctly
  Tool: Bash
  Steps:
    1. Run: bun run --cwd packages/api db:reset
    2. Run: bun run --cwd packages/api db:seed
    3. Assert: Exit code 0
    4. Query: SELECT COUNT(*) FROM reservation_request
    5. Assert: Returns > 0 rows
    6. Query: SELECT COUNT(*) FROM reservation
    7. Assert: Returns > 0 rows
    8. Verify: No errors in seed output
  Evidence: seed output, DB queries
```

**Commit**: YES

- Message: `refactor(api): update seeders - slotless appointment data`
- Files: `packages/api/src/db/seeders/*`

---

### Task 14: Actualizar Workflows Inngest

**What to do:**

- Actualizar `packages/api/src/types/inngest-events.ts`
- Actualizar `packages/api/src/inngest/functions/index.ts`
- Actualizar `packages/api/src/inngest/functions/reservation-confirmation.ts`
- Actualizar `packages/api/src/inngest/functions/reminders.ts`
- Actualizar `packages/api/src/inngest/functions/request-expiration.ts`
- Modificar workflows para usar `preferredAtUtc/scheduledAtUtc` en lugar de slot.startTime
- Actualizar eventos:
  - `reservation/request-created`
  - `reservation/approved`
  - `reservation/rejected`
  - `reservation/reschedule-proposed`
  - `reservation/reschedule-responded`
- Eliminar workflows relacionados a slots:
  - slot-generation
  - slot-expired-cleanup

**Must NOT do:**

- NO eliminar workflows de recordatorios (24h, 2h)
- NO usar slot.startTime

**Recommended Agent Profile:**

- **Category**: `unspecified-medium`
- **Skills**: N/A (backend refactor en código existente)

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 5
- **Blocks**: N/A
- **Blocked By**: Task 2 (reservation schema)

**References:**

- **Pattern**: `packages/api/src/inngest/functions/` - Workflows existentes
- **Pattern**: `packages/api/src/lib/inngest-client.ts` - Cliente Inngest

**Acceptance Criteria:**

- [ ] Workflows usan `preferredAtUtc/scheduledAtUtc`
- [ ] Eventos actualizados con nuevos campos
- [ ] Workflows de slots eliminados
- [ ] Recordatorios funcionan correctamente

**Agent-Executed QA:**

```
Scenario: Workflows trigger correctly
  Tool: Bash (test con Inngest test runner)
  Steps:
    1. Trigger: reservation/request-created event
    2. Assert: Workflow executes without errors
    3. Verify: scheduledAtUtc/scheduledTimezone used in notifications
    4. Test: Reminder calculation (24h before scheduled time)
  Evidence: test output, Inngest logs
```

**Commit**: YES

- Message: `refactor(api): update Inngest workflows - remove slot dependencies`
- Files: `packages/api/src/inngest/functions/*`

---

### Task 15: Actualizar Templates WhatsApp

**What to do:**

- Actualizar templates en `packages/api/src/services/ai/whatsapp-agent/webhooks.ts`
- Actualizar templates en configuración de Evolution API (si aplica)
- Modificar variables:
  - Cambiar `slot.startTime` → `scheduledAtUtc` + `scheduledTimezone` (render local)
  - Actualizar mensajes de confirmación
  - Agregar mensaje de reprogramación
- Templates a actualizar:
  - appointment_confirmed
  - appointment_reminder_24h
  - appointment_reminder_2h
  - appointment_rejected (con opción de reprogramación)

**Must NOT do:**

- NO eliminar templates, solo actualizar variables
- NO cambiar estructura de templates si Evolution API ya los tiene configurados

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A (backend + WhatsApp)

**Parallelization:**

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 5
- **Blocks**: N/A
- **Blocked By**: Task 9 (notification service)

**References:**

- **Pattern**: `packages/api/src/services/ai/whatsapp-agent/webhooks.ts` - Templates
- **Pattern**: `packages/api/src/services/business/notification.ts` - Uso de templates

**Acceptance Criteria:**

- [ ] Templates actualizados con nueva estructura
- [ ] Variables de fecha/hora correctas
- [ ] Mensaje de reprogramación agregado

**Agent-Executed QA:**

```
Scenario: WhatsApp templates work
  Tool: Manual verification (code review)
  Steps:
    1. Review: Template definitions in webhooks.ts
    2. Assert: No references to slot
    3. Assert: scheduledAtUtc/scheduledTimezone variables used
    4. Verify: Templates match Evolution API configuration
  Evidence: code review checklist
```

**Commit**: YES (agrupado con Task 14)

---

### Task 16: Ejecutar Tests E2E

**What to do:**

- Actualizar tests E2E existentes:
  - `packages/web/tests/e2e/reservations/reservation-request.spec.ts`
  - `packages/web/tests/e2e/reservations/reservation-approval.spec.ts`
- Modificar tests para nuevo flujo (sin slots)
- Agregar tests para:
  - Validación de horario de atención
  - Flujo de reprogramación
  - Metadata en solicitudes
- Ejecutar suite completa de E2E
- Asegurar que todos los tests pasen

**Must NOT do:**

- NO ignorar tests fallidos
- NO reducir cobertura de tests

**Recommended Agent Profile:**

- **Category**: `ultrabrain`
- **Skills**: Playwright

**Parallelization:**

- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 6
- **Blocks**: N/A
- **Blocked By**: TODAS las tareas anteriores

**References:**

- **Pattern**: `packages/web/tests/e2e/reservations/` - Tests existentes
- **Pattern**: `packages/web/tests/e2e/fixtures/reservation-data.ts` - Fixtures

**Acceptance Criteria:**

- [ ] Tests actualizados para nuevo flujo
- [ ] Suite E2E completa pasa
- [ ] Cobertura de tests mantenida o mejorada

**Agent-Executed QA:**

```
Scenario: All E2E tests pass
  Tool: Playwright
  Steps:
    1. Run: bun run --cwd packages/web test
    2. Assert: All tests pass
    3. Generate: Test report
    4. Screenshot: Test results
  Evidence: test report, screenshots
```

**Commit**: YES

- Message: `test(e2e): update tests for simplified appointment system`
- Files: `packages/web/tests/e2e/reservations/*`

---

### Task 17: Cleanup y Documentación

**What to do:**

- Eliminar código muerto (comentarios, imports no usados)
- Actualizar README si es necesario
- Crear documentación de migración (para futura eliminación de time_slot table)
- Verificar que no queden referencias a slots en código
- Hacer commit final con mensaje descriptivo

**Must NOT do:**

- NO eliminar time_slot table físicamente aún (dejar para fase 2)
- NO eliminar archivos de schema aún

**Verificación final:**

```bash
# Buscar referencias restantes a slots
grep -r "time_slot\|TimeSlot\|slotId\|SlotService" packages/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test.ts"
```

**Recommended Agent Profile:**

- **Category**: `quick`
- **Skills**: N/A

**Parallelization:**

- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 6
- **Blocks**: N/A
- **Blocked By**: Task 16

**References:**

- **Pattern**: Todo el codebase

**Acceptance Criteria:**

- [ ] No hay referencias funcionales a slots en flujo de citas (excepto deprecación controlada en schema/migraciones)
- [ ] No hay código comentado o imports no usados
- [ ] Documentación de migración creada
- [ ] Build completo pasa (API + Web)
- [ ] Linting pasa sin errores

**Agent-Executed QA:**

```
Scenario: Codebase is clean
  Tool: Bash
  Steps:
    1. Run: rg -n "slotId|TimeSlot|slotsRoutes|slot\\.startTime" packages/api/src packages/web/src
       Assert: Sin resultados en flujo de citas (excepto deprecación explícita)
    2. Run: bun run lint
       Assert: No errors
    3. Run: bun run build
       Assert: Both build successfully
  Evidence: command outputs
```

**Commit**: YES

- Message: `chore: cleanup slot references and finalize appointment simplification`
- Files: Varios archivos con limpieza

---

## Commit Strategy

| After Task | Message                                               | Files                      | Verification |
| ---------- | ----------------------------------------------------- | -------------------------- | ------------ |
| 1,2        | `refactor(db): simplify reservation schemas`          | schema files, migrations   | drizzle-kit  |
| 3          | `feat(api): add AvailabilityValidationService`        | validation service, tests  | bun test     |
| 4          | `refactor(api): remove slots routes`                  | slots.ts, index.ts         | build        |
| 5,6        | `refactor(api): update reservations API and AI tools` | routes, tools              | curl tests   |
| 7,8,9      | `refactor(api): simplify business services`           | services                   | bun test     |
| 10         | `refactor(web): remove slot components`               | components, hooks, routes  | build        |
| 11         | `feat(web): redesign reservations dashboard`          | dashboard.reservations.tsx | playwright   |
| 12         | `feat(web): simplify booking flow`                    | booking.tsx                | playwright   |
| 13         | `refactor(api): update seeders`                       | seeders                    | db:seed      |
| 14,15      | `refactor(api): update Inngest and WhatsApp`          | workflows, templates       | test         |
| 16         | `test(e2e): update tests`                             | e2e tests                  | web test     |
| 17         | `chore: cleanup and finalize`                         | various                    | lint, build  |

---

## Success Criteria

### Verification Commands

```bash
# Database
cd packages/api
bunx drizzle-kit generate --config drizzle.config.ts   # No errors, migrations created
bunx drizzle-kit push --config drizzle.config.ts       # Schema applied
bun run db:seed                                         # Seeders run without errors
cd ../..

# API
bun run build:api       # Build succeeds
bun run dev:api         # Server starts

# Web
bun run build:web       # Build succeeds
bun run dev:web         # Dev server starts

# Tests
bun run --cwd packages/api test     # Unit tests pass (API)
bun run --cwd packages/web test      # E2E tests pass (Playwright)

# Linting
bun run lint         # No lint errors
```

### Final Checklist

- [ ] Tabla time_slot no tiene dependencias funcionales en flujo de citas (soft deprecation)
- [ ] API endpoints funcionan sin referencias a slots
- [ ] AI puede crear solicitudes de cita directamente
- [ ] Doctor puede aprobar/rechazar/reprogramar desde dashboard
- [ ] Paciente puede solicitar cita sin seleccionar slots
- [ ] Paciente puede aceptar/rechazar propuesta de reprogramación
- [ ] Validación de horario funciona correctamente
- [ ] Conversión timezone↔UTC validada en request/approve/reminders
- [ ] Metadata se recolecta y almacena
- [ ] Notificaciones WhatsApp funcionan
- [ ] Recordatorios (24h, 2h) se envían correctamente
- [ ] Todos los tests pasan (unitarios + E2E)
- [ ] No hay código muerto ni imports no usados
- [ ] Build completo exitoso
