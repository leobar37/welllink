# Refactor AI Chat Tools - Work Plan

## TL;DR

> **Quick Summary**: Refactorizar las tools de AI chat para usar la arquitectura por capas correcta (servicios en lugar de SQL directo), hacer las FAQs configurables por usuario, y corregir imports dinámicos.
>
> **Deliverables**:
>
> - Schema actualizado con campo `faqConfig` en profile
> - 7 tools refactorizadas para usar servicios
> - Imports estáticos en lugar de dinámicos
> - Migration para nueva columna
>
> **Estimated Effort**: Medium (2-3 horas)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Schema → Services → Tools

---

## Context

### Original Request

El usuario identificó 3 problemas en las tools de AI chat:

1. Las tools ejecutan SQL directamente en lugar de usar servicios (violación de arquitectura)
2. Las FAQs están hardcodeadas, necesitan ser configurables
3. Imports dinámicos dentro de funciones en lugar de imports estáticos

### Interview Summary

**Key Discussions**:

- Se decidió usar Opción A: Campo JSON en tabla `profile` para FAQs (más simple)
- Se decidió usar Business Services en lugar de Repositories directamente
- El usuario confirmó proceder con todo el refactor

**Research Findings**:

- Existen servicios: `ClientService`, `PaymentMethodService`, `MedicalServiceBusinessService`, `ReservationRequestService`
- Existen repositorios: `TimeSlotRepository`, `WhatsAppContextRepository`
- Las tools actuales hacen queries SQL directas con `db.select().from()`

---

## Work Objectives

### Core Objective

Refactorizar las 7 tools de AI chat para seguir la arquitectura por capas, haciendo el código más mantenible, testeable y reutilizable.

### Concrete Deliverables

1. Campo `faqConfig: jsonb` agregado a tabla `profile`
2. Migration para columna `faq_config`
3. `ClientService` ajustado para aceptar `profileId` sin `RequestContext`
4. `patient.ts` refactorizado para usar `ClientService`
5. `appointments.ts` refactorizado para usar servicios
6. `services.ts` refactorizado para usar `MedicalServiceBusinessService`
7. `payment-methods.ts` refactorizado para usar `PaymentMethodService`
8. `faq.ts` refactorizado para leer desde `profile.faqConfig`
9. `pause-for-human.ts` con imports estáticos
10. `whatsapp-context.ts` con imports estáticos

### Definition of Done

- [ ] Todas las tools usan servicios/repositorios en lugar de SQL directo
- [ ] Las FAQs se leen desde configuración del perfil
- [ ] No hay imports dinámicos dentro de funciones
- [ ] `bun run lint` pasa sin errores
- [ ] TypeScript compila sin errores

### Must Have

- Mantener funcionalidad existente
- No romper contratos de las tools (mismo input/output)
- Usar servicios existentes cuando sea posible

### Must NOT Have (Guardrails)

- No modificar la lógica de negocio de los servicios (solo agregar métodos si es necesario)
- No cambiar la interfaz pública de las tools
- No agregar features nuevas, solo refactor

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES
- **User wants tests**: NO (Manual verification)
- **QA approach**: Manual verification

### Automated Verification

**For Backend changes** (using Bash):

```bash
# Type checking
cd packages/api && bun run lint

# Verify compilation
bunx tsc --noEmit
```

**Evidence to Capture:**

- [ ] Output de `bun run lint` sin errores
- [ ] Output de `tsc --noEmit` sin errores

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Agregar faqConfig a schema profile.ts
├── Task 2: Crear migration para faq_config
└── Task 3: Ajustar ClientService

Wave 2 (After Wave 1):
├── Task 4: Refactorizar patient.ts
├── Task 5: Refactorizar appointments.ts
├── Task 6: Refactorizar services.ts
└── Task 7: Refactorizar payment-methods.ts

Wave 3 (After Wave 2):
├── Task 8: Refactorizar faq.ts
├── Task 9: Refactorizar pause-for-human.ts
└── Task 10: Refactorizar whatsapp-context.ts

Wave 4 (Final):
└── Task 11: Verificar types y lint

Critical Path: Task 1 → Task 3 → Task 4 → Task 11
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| ---- | ---------- | ------ | -------------------- |
| 1    | None       | 2, 8   | 3                    |
| 2    | 1          | None   | 3, 4, 5, 6, 7        |
| 3    | None       | 4      | 1, 2                 |
| 4    | 3          | None   | 5, 6, 7              |
| 5    | None       | None   | 4, 6, 7              |
| 6    | None       | None   | 4, 5, 7              |
| 7    | None       | None   | 4, 5, 6              |
| 8    | 1          | None   | 9, 10                |
| 9    | None       | None   | 8, 10                |
| 10   | None       | None   | 8, 9                 |
| 11   | All        | None   | None                 |

---

## TODOs

### Wave 1: Schema y Servicios Base

- [ ] 1. Agregar campo faqConfig a schema profile.ts

  **What to do**:
  - Agregar interfaz `FAQConfig` al inicio del archivo
  - Agregar campo `faqConfig: jsonb("faq_config").$type<FAQConfig>()` a la tabla profile

  **Must NOT do**:
  - No modificar otros campos existentes
  - No cambiar tipos existentes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]
    - `bun-elysia`: Conocimiento de Drizzle ORM y schemas

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 2, Task 8
  - **Blocked By**: None

  **References**:
  - `packages/api/src/db/schema/profile.ts` - Schema actual
  - `packages/api/src/db/schema/client.ts` - Ejemplo de uso de jsonb

  **Acceptance Criteria**:
  - [ ] Interfaz `FAQConfig` definida correctamente
  - [ ] Campo `faqConfig` agregado a tabla profile
  - [ ] TypeScript compila sin errores

  **Commit**: YES
  - Message: `feat(schema): add faqConfig field to profile`
  - Files: `packages/api/src/db/schema/profile.ts`

---

- [ ] 2. Crear migration para columna faq_config

  **What to do**:
  - Generar migration con Drizzle para agregar columna `faq_config` jsonb a tabla profile
  - Valor por defecto: `[]` (array vacío)

  **Must NOT do**:
  - No modificar otras tablas
  - No eliminar datos existentes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `packages/api/src/db/migrations/` - Directorio de migrations

  **Acceptance Criteria**:
  - [ ] Migration generada correctamente
  - [ ] Migration puede aplicarse sin errores

  **Commit**: YES
  - Message: `feat(db): add migration for faq_config column`
  - Files: `packages/api/src/db/migrations/*`

---

- [ ] 3. Ajustar ClientService para aceptar profileId sin RequestContext

  **What to do**:
  - Crear métodos alternativos en `ClientService` que acepten `profileId` directamente
  - Métodos necesarios:
    - `findByPhoneAndProfile(phone: string, profileId: string)`
    - `createForProfile(data: NewClient & { profileId: string })`
    - `updateForProfile(id: string, profileId: string, data: Partial<NewClient>)`

  **Must NOT do**:
  - No eliminar métodos existentes (mantener compatibilidad)
  - No cambiar comportamiento de métodos existentes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-medium`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/business/client.ts` - Servicio actual
  - `packages/api/src/services/repository/client.ts` - Repository con métodos que aceptan profileId

  **Acceptance Criteria**:
  - [ ] Nuevos métodos creados
  - [ ] Métodos existentes siguen funcionando
  - [ ] TypeScript compila sin errores

  **Commit**: YES
  - Message: `feat(services): add profileId-based methods to ClientService`
  - Files: `packages/api/src/services/business/client.ts`

---

### Wave 2: Refactorizar Tools Principales

- [ ] 4. Refactorizar patient.ts - usar ClientService

  **What to do**:
  - Reemplazar queries SQL directas con llamadas a `ClientService`
  - Importar `ClientService` y `ClientNoteRepository` estáticamente
  - Usar métodos nuevos del servicio

  **Must NOT do**:
  - No cambiar la interfaz de las tools (mismo input/output)
  - No eliminar manejo de errores existente

  **Recommended Agent Profile**:
  - **Category**: `unspecified-medium`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:
  - `packages/api/src/services/ai/chat/tools/patient.ts` - Tool actual
  - `packages/api/src/services/business/client.ts` - Servicio a usar
  - `packages/api/src/services/repository/client.ts` - Repository

  **Acceptance Criteria**:
  - [ ] No hay queries SQL directas
  - [ ] Usa `ClientService` para operaciones
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use ClientService in patient tool`
  - Files: `packages/api/src/services/ai/chat/tools/patient.ts`

---

- [ ] 5. Refactorizar appointments.ts - usar servicios

  **What to do**:
  - `checkAvailabilityTool`: Usar `TimeSlotRepository.findAvailableSlots()`
  - `createReservationTool`: Usar `ReservationRequestService.createRequest()`
  - Importar servicios estáticamente

  **Must NOT do**:
  - No cambiar la interfaz de las tools
  - No modificar lógica de negocio

  **Recommended Agent Profile**:
  - **Category**: `unspecified-medium`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/ai/chat/tools/appointments.ts` - Tool actual
  - `packages/api/src/services/repository/time-slot.ts` - TimeSlotRepository
  - `packages/api/src/services/business/reservation-request.ts` - ReservationRequestService

  **Acceptance Criteria**:
  - [ ] No hay queries SQL directas
  - [ ] Usa servicios/repositorios apropiados
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use services in appointments tool`
  - Files: `packages/api/src/services/ai/chat/tools/appointments.ts`

---

- [ ] 6. Refactorizar services.ts - usar MedicalServiceBusinessService

  **What to do**:
  - `listServicesTool`: Usar `MedicalServiceBusinessService.getActiveServicesByProfile()`
  - `getServiceDetailsTool`: Usar `MedicalServiceBusinessService.getServiceById()`
  - Importar servicio estáticamente

  **Must NOT do**:
  - No cambiar la interfaz de las tools

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/ai/chat/tools/services.ts` - Tool actual
  - `packages/api/src/services/business/medical-service.ts` - Servicio

  **Acceptance Criteria**:
  - [ ] No hay queries SQL directas
  - [ ] Usa `MedicalServiceBusinessService`
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use MedicalServiceBusinessService in services tool`
  - Files: `packages/api/src/services/ai/chat/tools/services.ts`

---

- [ ] 7. Refactorizar payment-methods.ts - usar PaymentMethodService

  **What to do**:
  - `listPaymentMethodsTool`: Usar `PaymentMethodService.getActivePaymentMethods()`
  - `getPaymentMethodDetailsTool`: Usar `PaymentMethodService.getPaymentMethodById()`
  - Importar servicio estáticamente

  **Must NOT do**:
  - No cambiar la interfaz de las tools

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/ai/chat/tools/payment-methods.ts` - Tool actual
  - `packages/api/src/services/business/payment-method.ts` - Servicio

  **Acceptance Criteria**:
  - [ ] No hay queries SQL directas
  - [ ] Usa `PaymentMethodService`
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use PaymentMethodService in payment-methods tool`
  - Files: `packages/api/src/services/ai/chat/tools/payment-methods.ts`

---

### Wave 3: FAQ y Imports

- [ ] 8. Refactorizar faq.ts - leer desde profile.faqConfig

  **What to do**:
  - Importar `ProfileRepository` estáticamente
  - Leer FAQs desde `profile.faqConfig`
  - Si no hay FAQs configuradas, usar defaults actuales como fallback
  - Agregar método para obtener FAQs con fallback

  **Must NOT do**:
  - No eliminar FAQs por defecto (usar como fallback)
  - No cambiar la interfaz de la tool

  **Recommended Agent Profile**:
  - **Category**: `unspecified-medium`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `packages/api/src/services/ai/chat/tools/faq.ts` - Tool actual
  - `packages/api/src/services/repository/profile.ts` - ProfileRepository
  - `packages/api/src/db/schema/profile.ts` - FAQConfig type

  **Acceptance Criteria**:
  - [ ] Lee FAQs desde configuración del perfil
  - [ ] Usa FAQs por defecto como fallback
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): read FAQs from profile config with fallback`
  - Files: `packages/api/src/services/ai/chat/tools/faq.ts`

---

- [ ] 9. Refactorizar pause-for-human.ts - imports estáticos

  **What to do**:
  - Mover imports dinámicos (líneas 31-35) a imports estáticos al inicio del archivo
  - Importar: `WhatsAppContextRepository`, `db`, `profile`, `eq`

  **Must NOT do**:
  - No cambiar la lógica de la función

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/ai/chat/tools/pause-for-human.ts` - Tool actual

  **Acceptance Criteria**:
  - [ ] Todos los imports son estáticos
  - [ ] No hay `await import()` dentro de funciones
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use static imports in pause-for-human tool`
  - Files: `packages/api/src/services/ai/chat/tools/pause-for-human.ts`

---

- [ ] 10. Refactorizar whatsapp-context.ts - imports estáticos

  **What to do**:
  - Mover import dinámico (línea 19-20) a import estático al inicio del archivo
  - Importar: `WhatsAppContextRepository`

  **Must NOT do**:
  - No cambiar la lógica de la función

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/api/src/services/ai/chat/tools/whatsapp-context.ts` - Tool actual

  **Acceptance Criteria**:
  - [ ] Todos los imports son estáticos
  - [ ] No hay `await import()` dentro de funciones
  - [ ] Mismo comportamiento externo

  **Commit**: YES
  - Message: `refactor(tools): use static imports in whatsapp-context tool`
  - Files: `packages/api/src/services/ai/chat/tools/whatsapp-context.ts`

---

### Wave 4: Validación

- [ ] 11. Verificar types y lint

  **What to do**:
  - Ejecutar `bun run lint` en packages/api
  - Ejecutar `bunx tsc --noEmit` para verificar types
  - Corregir cualquier error

  **Must NOT do**:
  - No ignorar errores de TypeScript

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`bun-elysia`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (Final)
  - **Blocks**: None
  - **Blocked By**: All previous tasks

  **Acceptance Criteria**:
  - [ ] `bun run lint` pasa sin errores
  - [ ] `tsc --noEmit` pasa sin errores

  **Commit**: NO (validation only)

---

## Commit Strategy

| After Task | Message                                                               | Files               |
| ---------- | --------------------------------------------------------------------- | ------------------- |
| 1          | `feat(schema): add faqConfig field to profile`                        | profile.ts          |
| 2          | `feat(db): add migration for faq_config column`                       | migrations/\*       |
| 3          | `feat(services): add profileId-based methods to ClientService`        | client.ts           |
| 4          | `refactor(tools): use ClientService in patient tool`                  | patient.ts          |
| 5          | `refactor(tools): use services in appointments tool`                  | appointments.ts     |
| 6          | `refactor(tools): use MedicalServiceBusinessService in services tool` | services.ts         |
| 7          | `refactor(tools): use PaymentMethodService in payment-methods tool`   | payment-methods.ts  |
| 8          | `refactor(tools): read FAQs from profile config with fallback`        | faq.ts              |
| 9          | `refactor(tools): use static imports in pause-for-human tool`         | pause-for-human.ts  |
| 10         | `refactor(tools): use static imports in whatsapp-context tool`        | whatsapp-context.ts |

---

## Success Criteria

### Verification Commands

```bash
cd packages/api
bun run lint
bunx tsc --noEmit
```

### Final Checklist

- [ ] Todas las tools usan servicios/repositorios (no SQL directo)
- [ ] Las FAQs se leen desde configuración del perfil
- [ ] No hay imports dinámicos dentro de funciones
- [ ] Linting pasa sin errores
- [ ] TypeScript compila sin errores
- [ ] Funcionalidad preservada (mismos inputs/outputs)
