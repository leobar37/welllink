# AI Tools Reference

Catálogo completo de herramientas implementadas en el agente médico de Wellness-Link y patrones para crear nuevas herramientas.

## Índice

1. [Patrón de Creación de Tools](#patrón-de-creación-de-tools)
2. [Catálogo de Herramientas](#catálogo-de-herramientas)
3. [Best Practices](#best-practices)
4. [Ejemplos de Implementación](#ejemplos-de-implementación)

---

## Patrón de Creación de Tools

### Estructura Básica

```typescript
import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { tableName } from "../../../../db/schema/table";
import { eq, and } from "drizzle-orm";

// 1. Definir schema de entrada con Zod
const ToolInput = z.object({
  profileId: z.string().describe("The profile ID"),
  param1: z.string().describe("Description for LLM"),
  param2: z.number().optional().describe("Optional parameter"),
});

// 2. Crear la herramienta
export const myTool = createTool({
  name: "tool_name",
  description: "Human-readable description explaining what this tool does and when to use it",

  parameters: ToolInput,

  execute: async ({ profileId, param1, param2 }) => {
    try {
      // 3. Ejecutar lógica de negocio
      const [result] = await db
        .select()
        .from(tableName)
        .where(eq(tableName.id, param1))
        .limit(1);

      if (!result) {
        return {
          found: false,
          message: `No item found with ID ${param1}`,
        };
      }

      // 4. Retornar datos estructurados
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 5. Manejo de errores
      return {
        error: true,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
```

### Convenciones de Nomenclatura

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| **Tool function** | camelCase con "Tool" suffix | `getPatientTool` |
| **Tool name** | snake_case | `get_patient` |
| **Input schema** | PascalCase con "Input" suffix | `GetPatientInput` |
| **File** | kebab-case | `patient.ts` |

---

## Catálogo de Herramientas

### 1. Patient Management (`patient.ts`)

Herramientas para gestión de pacientes y CRM.

#### `get_patient`

Busca un paciente por número de teléfono.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  phone: string;      // Phone with country code (+519...)
}

Output: {
  found: boolean;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    label: "consumidor" | "prospecto" | "afiliado";
  };
  message?: string;
  error?: boolean;
}
```

**Cuándo usar el LLM:**
- Para verificar si un paciente existe antes de crear uno nuevo
- Para obtener información del paciente
- Para identificar al usuario

#### `create_patient`

Crea un nuevo registro de paciente.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  phone: string;      // Patient phone
  name: string;       // Patient full name
  email?: string;     // Optional email
}

Output: {
  success: boolean;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    label: "prospecto";  // Default label
  };
  error?: boolean;
  message?: string;
}
```

**Cuándo usar el LLM:**
- Cuando un paciente contacta por primera vez
- Después de verificar que el paciente no existe

#### `update_patient_label`

Actualiza la etiqueta del paciente para seguimiento CRM.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  patientId: string;  // Patient ID
  label: "consumidor" | "prospecto" | "afiliado";
}

Output: {
  success: boolean;
  patient?: {
    id: string;
    name: string;
    label: string;
  };
  error?: boolean;
  message?: string;
}
```

**Labels:**
- `prospecto`: Cliente potencial (default)
- `consumidor`: Ha realizado una compra/cita
- `afiliado`: Afiliado o partner

**Cuándo usar el LLM:**
- Después de completar una cita (mover de prospecto a consumidor)

---

### 2. Medical Services (`services.ts`)

Herramientas para consultar catálogo de servicios médicos.

#### `list_services`

Lista servicios médicos con filtros opcionales.

```typescript
Input: {
  profileId: string;           // Profile/doctor ID
  category?: string;           // Filter by category
  activeOnly?: boolean;        // Show only active services
}

Output: {
  success: boolean;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string | null;      // Formatted price string
    duration: string | null;   // Formatted duration
    category: string | null;
  }>;
  total: number;
}
```

**Cuándo usar el LLM:**
- Cuando el paciente pregunta por servicios disponibles
- Para mostrar el catálogo de servicios

#### `get_service_details`

Obtiene detalles de un servicio específico.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  serviceId: string;  // Service ID
}

Output: {
  success: boolean;
  service?: {
    id: string;
    name: string;
    description: string | null;
    price: string | null;
    duration: string | null;
    category: string | null;
  };
  error?: boolean;
  message?: string;
}
```

**Cuándo usar el LLM:**
- Para obtener detalles de un servicio específico
- Cuando el paciente pregunta detalles de un servicio en particular

---

### 3. Appointments (`appointments.ts`)

Herramientas para gestión de citas y disponibilidad.

#### `check_availability`

Verifica espacios disponibles para un servicio en una fecha específica.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  serviceId: string;  // Service ID
  date: string;       // YYYY-MM-DD format
}

Output: {
  success: boolean;
  date: string;
  availableSlots: Array<{
    id: string;
    startTime: string;      // ISO 8601 datetime
    endTime: string;        // ISO 8601 datetime
    available: number;      // Available count
  }>;
  totalAvailable: number;
}
```

**Lógica:**
- Filtra slots por fecha y servicio
- Solo retorna slots con `status = "available"`
- Solo retorna slots con `currentReservations < maxReservations`
- Ordena por startTime ascendente

**Cuándo usar el LLM:**
- Cuando el paciente quiere agendar una cita
- Para mostrar horarios disponibles
- Después de que el paciente selecciona un servicio

#### `create_reservation`

Crea una solicitud de reserva (pendiente de aprobación).

```typescript
Input: {
  profileId: string;
  slotId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  chiefComplaint?: string;
}

Output: {
  success: boolean;
  reservation?: {
    id: string;
    status: "pending";
    requestedTime: string;   // ISO datetime
    expiresAt: string;       // ISO datetime (+30 min)
    message: string;         // Spanish confirmation message
  };
  error?: boolean;
  message?: string;
}
```

**Comportamiento:**
- Crea reserva con `status = "pending"`
- Expira en 30 minutos
- `urgencyLevel = "normal"`
- `preferredContactMethod = "whatsapp"`
- Mensaje de confirmación en español

**Cuándo usar el LLM:**
- Cuando el paciente confirma que quiere agendar
- Después de recopilar datos del paciente
- Para finalizar el flujo de agendamiento

---

### 4. FAQ (`faq.ts`)

Herramienta para búsqueda de preguntas frecuentes.

#### `search_faq`

Busca FAQs por palabras clave.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  query: string;      // Search query
  category?: string;  // Optional category filter
  limit?: number;     // Max results (default: 5)
}

Output: {
  success: boolean;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
    order: number;
  }>;
  total: number;
}
```

**Lógica de búsqueda:**
- Búsqueda case-insensitive
- Busca en question y answer
- Filtra por category si se proporciona
- Ordena por relevance y order

**Cuándo usar el LLM:**
- Para preguntas comunes (horarios, ubicación, formas de pago)
- Cuando el paciente hace una pregunta general

---

### 5. Payment Methods (`payment-methods.ts`)

Herramientas para consultar métodos de pago aceptados.

#### `list_payment_methods`

Lista métodos de pago activos para un perfil.

```typescript
Input: {
  profileId: string;  // Profile/doctor ID
  activeOnly?: boolean;  // Show only active methods
}

Output: {
  success: boolean;
  paymentMethods: Array<{
    id: string;
    type: "cash" | "card" | "transfer" | "wallet" | "insurance";
    name: string;
    description: string | null;
    isActive: boolean;
  }>;
  total: number;
}
```

**Tipos de métodos:**
- `cash`: Efectivo
- `card`: Tarjeta de crédito/débito
- `transfer`: Transferencia bancaria
- `wallet`: Billetera digital (Yape, Plin, etc.)
- `insurance`: Seguro médico

**Cuándo usar el LLM:**
- Cuando el paciente pregunta por formas de pago
- Para informar sobre opciones de pago

#### `get_payment_method_details`

Obtiene detalles de un método de pago específico.

```typescript
Input: {
  profileId: string;
  paymentMethodId: string;
}

Output: {
  success: boolean;
  paymentMethod?: {
    id: string;
    type: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  error?: boolean;
  message?: string;
}
```

---

### 6. WhatsApp Context (`whatsapp-context.ts`)

Herramientas para handoff entre WhatsApp y Web.

#### `load_whatsapp_context`

Carga el contexto de conversación previa de WhatsApp.

```typescript
Input: {
  phone: string;  // User phone number
}

Output: {
  found: boolean;
  status?: "ACTIVE" | "TRANSFERRED_TO_WIDGET" | "PAUSED_FOR_HUMAN";
  history?: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  summary?: string;
  patientId?: string;
  canContinue?: boolean;
  isNewConversation?: boolean;
  message?: string;
}
```

**Estados:**
- `ACTIVE`: Conversación activa en WhatsApp
- `TRANSFERRED_TO_WIDGET`: Transferido al widget web
- `PAUSED_FOR_HUMAN`: Pausado para atención humana

**Cuándo usar el LLM:**
- Cuando un usuario llega desde WhatsApp
- Para continuar una conversación previa
- NO para identificación (usar tools de paciente)

---

### 7. Pause for Human (`pause-for-human.ts`)

Herramienta para escalado a operador humano.

#### `pause_for_human`

Marca la conversación para atención humana directa.

```typescript
Input: {
  conversationId: string;
  reason: string;        // Reason for escalation
  phone?: string;        // Optional phone for WhatsApp
  notes?: string;        // Additional notes
}

Output: {
  success: boolean;
  paused: boolean;
  message: string;       // Human-readable message
  context?: {
    conversationId: string;
    pausedAt: string;    // ISO datetime
    reason: string;
  };
}
```

**Cuándo usar el LLM:**
- Cuando el paciente lo solicita explícitamente
- Para preguntas complejas fuera del alcance del bot
- Para situaciones que requieren juicio humano

---

## Best Practices

### 1. Estructura de Response

**Response exitoso:**
```typescript
return {
  success: true,
  data: result,  // Datos estructurados
};
```

**Response con "not found":**
```typescript
return {
  found: false,  // Para búsquedas
  message: "No item found with ID X",
};
```

**Response con error:**
```typescript
return {
  error: true,
  message: "Descriptive error message",
};
```

### 2. Validaciones

```typescript
// Validar datos antes de DB
if (!param1 || param1.trim() === "") {
  return {
    error: true,
    message: "Parameter param1 is required",
  };
}

// Validar formato
if (!phone.startsWith("+")) {
  return {
    error: true,
    message: "Phone must include country code (e.g., +51)",
  };
}
```

### 3. Query Patterns

```typescript
// Single item lookup
const [item] = await db
  .select()
  .from(table)
  .where(eq(table.id, id))
  .limit(1);

if (!item) {
  return { found: false };
}

// Multiple items with filter
const items = await db
  .select()
  .from(table)
  .where(
    and(
      eq(table.profileId, profileId),
      eq(table.isActive, true)
    )
  )
  .orderBy(table.createdAt);

// Count
const total = items.length;
```

### 4. Transaction Safety

```typescript
try {
  // DB operations
  const [result] = await db.insert(table).values(...).returning();

  return { success: true, data: result };
} catch (error) {
  console.error("Tool error:", error);
  return {
    error: true,
    message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
  };
}
```

### 5. Descripciones para el LLM

**❌ Mal:**
```typescript
description: "Get patient"
```

**✅ Bien:**
```typescript
description: "Look up a patient by phone number. Returns patient info if found, or null if not found. Use this to check if a patient exists before creating a new one."
```

### 6. Zod Schemas

**Usa `.describe()` para parámetros:**
```typescript
const Input = z.object({
  phone: z.string()
    .describe("Patient phone number with country code, e.g., +51987654321"),
  date: z.string()
    .describe("Date in YYYY-MM-DD format to check availability"),
});
```

**Enums para valores conocidos:**
```typescript
const LabelInput = z.object({
  label: z.enum(["consumidor", "prospecto", "afiliado"])
    .describe("New label for the patient"),
});
```

---

## Ejemplos de Implementación

### Tool con Query Complejo

```typescript
export const checkAvailabilityTool = createTool({
  name: "check_availability",
  description: "Check available time slots for a service on a specific date. Use this when a patient wants to schedule an appointment. Returns available slots with start times. Only shows slots that are currently available (not booked).",
  parameters: z.object({
    profileId: z.string().describe("The profile/doctor ID"),
    serviceId: z.string().describe("The service ID to check availability for"),
    date: z.string().describe("Date in YYYY-MM-DD format to check availability"),
  }),
  execute: async ({ profileId, serviceId, date }) => {
    try {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const slots = await db
        .select({
          id: timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          maxReservations: timeSlot.maxReservations,
          currentReservations: timeSlot.currentReservations,
        })
        .from(timeSlot)
        .where(
          and(
            eq(timeSlot.profileId, profileId),
            eq(timeSlot.serviceId, serviceId),
            eq(timeSlot.status, "available"),
            gte(timeSlot.startTime, startOfDay)
          )
        )
        .orderBy(timeSlot.startTime);

      const availableSlots = slots
        .filter((slot) => slot.currentReservations < slot.maxReservations)
        .map((slot) => ({
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          available: slot.maxReservations - slot.currentReservations,
        }));

      return {
        success: true,
        date,
        availableSlots,
        totalAvailable: availableSlots.length,
      };
    } catch (error) {
      return {
        error: true,
        message: `Error checking availability: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
```

### Tool con Creación en DB

```typescript
export const createReservationTool = createTool({
  name: "create_reservation",
  description: "Create a new reservation request. Use this when a patient confirms they want to book an appointment. The request will be pending approval and the patient will be notified. Returns the reservation ID for tracking.",
  parameters: z.object({
    profileId: z.string().describe("The profile/doctor ID"),
    slotId: z.string().describe("The time slot ID"),
    serviceId: z.string().describe("The service ID"),
    patientName: z.string().describe("Patient full name"),
    patientPhone: z.string().describe("Patient phone number"),
    patientEmail: z.string().optional().describe("Patient email (optional)"),
    chiefComplaint: z.string().optional().describe("Main complaint or reason for visit"),
  }),
  execute: async (data) => {
    try {
      const requestedTime = new Date();

      const [reservation] = await db
        .insert(reservationRequest)
        .values({
          ...data,
          requestedTime,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "pending",
          urgencyLevel: "normal",
          preferredContactMethod: "whatsapp",
        })
        .returning();

      return {
        success: true,
        reservation: {
          id: reservation.id,
          status: reservation.status,
          requestedTime: reservation.requestedTime.toISOString(),
          expiresAt: reservation.expiresAt.toISOString(),
          message:
            "Tu solicitud de cita ha sido enviada. El médico la revisará y confirmará pronto. Te notificaremos por WhatsApp cuando sea aprobada.",
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error creating reservation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
```

---

## Exportación de Tools

```typescript
// packages/api/src/services/ai/chat/tools/index.ts

// Patient management tools
export {
  getPatientTool,
  createPatientTool,
  updatePatientLabelTool,
} from "./patient";

// Medical services tools
export { listServicesTool, getServiceDetailsTool } from "./services";

// Appointment scheduling tools
export { checkAvailabilityTool, createReservationTool } from "./appointments";

// FAQ and information tools
export { searchFAQTool } from "./faq";

// Payment methods tools
export {
  listPaymentMethodsTool,
  getPaymentMethodDetailsTool,
} from "./payment-methods";

// WhatsApp context tools
export { loadWhatsAppContextTool } from "./whatsapp-context";
export { pauseForHumanTool } from "./pause-for-human";
```

---

## Referencias

- **VoltAgent Tools Guide**: `docs/ai-voltagent-guide.md#herramientas-tools`
- **Agent Implementation**: `docs/ai-agent-reference.md`
- **UI Components**: `docs/ai-ui-reference.md`
- **Source Code**: `packages/api/src/services/ai/chat/tools/`
