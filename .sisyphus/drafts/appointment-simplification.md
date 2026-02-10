# Draft: Simplificación del Sistema de Citas Médicas

## Propuesta del Usuario

### Problema Actual

1. Los doctores deben generar slots manualmente o configurar reglas de disponibilidad complejas
2. La IA no puede operar rápidamente porque hay múltiples procesos intermedios
3. El sistema actual es propenso a fallos

### Solución Propuesta

**Simplificar a un flujo directo:**

```
[Paciente] → Solicita cita (con fecha/hora preferida) → [Doctor/Clínica]
                                              ↓
                                    Decide: Aprobar / Rechazar / Reprogramar
```

**Sin slots predefinidos** - El paciente propone, el doctor decide.

### Nueva Funcionalidad: Campo Metadata

Agregar propiedad `metadata` JSONB a las solicitudes de cita para que el asistente virtual recolecte información adicional del cliente:

Ejemplo de metadata:

```json
{
  "motivo_consulta": "Dolor de espalda persistente",
  "tipo_paciente": "nuevo",
  "seguro_medico": "SIS",
  "notas_adicionales": "Primera vez en el consultorio",
  "preguntas_paciente": [
    "¿Debo traer estudios previos?",
    "¿Cuánto dura la consulta?"
  ]
}
```

## Decisiones Técnicas Confirmadas

### Cambios en Base de Datos

- ✅ **ELIMINAR** tabla `time_slot` completamente
- ✅ **ELIMINAR** tabla `availability_rule` (ya no necesaria)
- ✅ **MODIFICAR** tabla `reservation_request`:
  - Eliminar campo `slotId` (ya no vinculado a slots)
  - Agregar campos `preferredDate`, `preferredTime`
  - Agregar campo `metadata` (JSONB)
  - Mantener campos de paciente (nombre, teléfono, email, etc.)
- ✅ **MODIFICAR** tabla `reservation`:
  - Eliminar campo `slotId`
  - Agregar campos `scheduledDate`, `scheduledTime`
  - Agregar campo `rescheduledFrom` (para tracking de reprogramaciones)

### Cambios en API

- ✅ **ELIMINAR** rutas `/slots/*`
- ✅ **SIMPLIFICAR** rutas `/reservations/*`:
  - POST `/reservations/request` - Crear solicitud (sin slotId)
  - POST `/reservations/approve` - Aprobar con fecha/hora confirmada
  - POST `/reservations/reschedule` - Reprogramar propuesta
  - POST `/reservations/reject` - Rechazar
  - GET `/reservations/pending/:profileId` - Ver pendientes
  - GET `/reservations/:id` - Ver detalle

### Cambios en Servicios

- ✅ **ELIMINAR** `SlotService` y `TimeSlotRepository`
- ✅ **SIMPLIFICAR** `ReservationRequestService`:
  - Ya no valida disponibilidad de slots
  - Solo crea solicitudes pendientes
- ✅ **SIMPLIFICAR** `ApprovalService`:
  - Aprueba directamente sin gestionar estados de slot
  - Puede proponer nueva fecha/hora

### Cambios en AI Tools

- ✅ **ELIMINAR** `checkAvailabilityTool` (ya no hay slots)
- ✅ **SIMPLIFICAR** `createReservationTool`:
  - Acepta fecha/hora preferida en lugar de slotId
  - Permite pasar metadata
- ✅ **NUEVO** `collectMetadataTool` - Para que la IA recolecte información estructurada

### Cambios en Frontend

- ✅ **ELIMINAR** componentes de slots (`slots-list`, `slot-card`, etc.)
- ✅ **SIMPLIFICAR** página de reservas del doctor:
  - Lista de solicitudes pendientes
  - Vista de aprobación con selector de fecha/hora
  - Opción de reprogramar
- ✅ **SIMPLIFICAR** flujo de booking para pacientes:
  - Selector de fecha (calendario)
  - Campo de hora preferida
  - Formulario de datos del paciente
  - Opcional: metadata adicional recolectada por IA

## Estrategia de Migración

### Fase 1: Soft Deprecation (Mantener retrocompatibilidad temporal)

1. Crear nuevas tablas/campos
2. Mantener tablas antiguas como read-only
3. Migrar datos existentes (slots → nuevas citas)

### Fase 2: Cleanup (Después de confirmar estabilidad)

1. Eliminar tablas antiguas
2. Eliminar código deprecated
3. Actualizar documentación

## Decisiones Pendientes

### Pregunta para el Usuario:

1. **¿Deberíamos mantener la tabla `availability_rule` como referencia informativa?**
   - No afecta slots, solo información de horarios de atención
   - Útil para que el paciente sepa cuándo atiende el doctor
   - **Recomendación:** Mantener como tabla opcional de "horario de atención"

2. **¿Qué campos específicos debe incluir el metadata?**
   - ¿Estructura flexible o campos definidos?
   - ¿El doctor puede configurar qué metadata recolectar?
   - **Recomendación:** JSONB flexible con sugerencias estándar

## Ventajas de la Nueva Arquitectura

| Aspecto                  | Antes                                                   | Después                                                      |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| **Complejidad BD**       | 6 estados de slot + transiciones                        | 4 estados simples (pending, approved, rejected, rescheduled) |
| **Workflows Inngest**    | 5+ workflows (generación, expiración, etc.)             | 2 workflows (recordatorios, seguimiento)                     |
| **Operación IA**         | Múltiples llamadas (check slots, create, update status) | Una llamada directa                                          |
| **Configuración Doctor** | Crear reglas + generar slots                            | Solo recibir y decidir                                       |
| **Flexibilidad**         | Slots rígidos                                           | Fechas/horas flexibles                                       |

## Notas de Implementación

### Mantener:

- ✅ Sistema de notificaciones WhatsApp
- ✅ Recordatorios (24h, 2h antes)
- ✅ Seguimiento post-cita
- ✅ Historial del paciente
- ✅ Estadísticas del doctor

### Simplificar:

- ❌ Eliminación de validaciones de solapamiento
- ❌ Eliminación de lógica de capacidad (maxReservations)
- ❌ Eliminación de expiración de slots
- ❌ Eliminación de bloqueo/desbloqueo de slots

### Agregar:

- ✅ Campo metadata en solicitudes
- ✅ Flujo de reprogramación más flexible
- ✅ Mejor tracking de cambios en citas
