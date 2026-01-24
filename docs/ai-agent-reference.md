# AI Agent Reference

Arquitectura completa del agente médico de IA implementado en Wellness-Link con VoltAgent.

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Configuración del Agente](#configuración-del-agente)
3. [Sistema de Memoria](#sistema-de-memoria)
4. [Context Management](#context-management)
5. [Structured Responses](#structured-responses)
6. [API Routes](#api-routes)
7. [WhatsApp Integration](#whatsapp-integration)

---

## Arquitectura General

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Chat Widget con MessageRenderer                      │
│  - Part components (services, availability, etc.)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / SSE
┌────────────────────▼────────────────────────────────────┐
│              API Routes (Elysia)                        │
│  POST /api/agent/chat    - Single response              │
│  POST /api/agent/stream  - SSE streaming                │
│  POST /api/agent/escalate - Human handoff              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              AI Agent (VoltAgent)                       │
│  - 10+ tools (patient, services, appointments, etc.)    │
│  - LibSQL memory for conversation history               │
│  - MiniMax M2.1 model (Anthropic-compatible)           │
│  - Structured responses (JSON blocks)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Database (PostgreSQL + Drizzle)            │
│  - client, medical_service, time_slot                  │
│  - reservation_request, payment_method                 │
│  - whatsapp_context                                     │
└─────────────────────────────────────────────────────────┘
```

### Archivos del Agente

```
packages/api/src/services/ai/chat/
├── agent.ts              # Agent factory & singleton
├── config.ts             # Agent configuration & prompts
├── parser.ts             # Structured response parser
├── schema.ts             # Zod schemas for responses
├── index.ts              # Public exports
├── memory/
│   └── config.ts         # LibSQL memory adapters
└── tools/
    ├── index.ts          # Tool exports
    ├── patient.ts        # CRM tools
    ├── appointments.ts   # Scheduling tools
    ├── services.ts       # Service catalog tools
    ├── payment-methods.ts # Payment info tools
    ├── faq.ts            # FAQ search tool
    ├── whatsapp-context.ts # Handoff tool
    └── pause-for-human.ts # Human escalation
```

---

## Configuración del Agente

### Factory del Agente

```typescript
// packages/api/src/services/ai/chat/agent.ts

import { Agent } from "@voltagent/core";
import { chatAgentConfig } from "./config";
import { createChatMemory } from "./memory/config";
import { /* all tools */ } from "./tools";

export function createMedicalChatAgent(): Agent {
  const memory = createChatMemory();

  const agent = new Agent({
    ...chatAgentConfig,
    tools: [
      // Patient management
      getPatientTool,
      createPatientTool,
      updatePatientLabelTool,

      // Service information
      listServicesTool,
      getServiceDetailsTool,

      // Appointments
      checkAvailabilityTool,
      createReservationTool,

      // FAQ
      searchFAQTool,

      // Payments
      listPaymentMethodsTool,
      getPaymentMethodDetailsTool,

      // WhatsApp
      loadWhatsAppContextTool,
      pauseForHumanTool,
    ],
    memory,
  });

  return agent;
}
```

### Patrón Singleton

```typescript
let agentInstance: Agent | null = null;

export function getMedicalChatAgent(): Agent {
  if (!agentInstance) {
    agentInstance = createMedicalChatAgent();
  }
  return agentInstance;
}

export function resetAgentInstance(): void {
  agentInstance = null;
}
```

**Por qué singleton:**
- Performance: Evita recrear el agente en cada request
- Tools se registran una sola vez
- Memory se adjunta una vez
- Reduce overhead de inicialización

### Configuración del Agente

```typescript
// packages/api/src/services/ai/chat/config.ts

import { minimaxAnthropic } from "vercel-minimax-ai-provider";

export const chatAgentConfig = {
  name: "medical-chat-assistant",

  // Instructions dinámicas basadas en perfil
  instructions: getChatInstructions({
    displayName: "el profesional",
    title: "",
    bio: "",
  }),

  // Provider: MiniMax con API compatible Anthropic
  model: minimaxAnthropic("MiniMax-M2.1"),

  // Máximo de iteraciones para tool calling
  maxSteps: 10,

  // Temperature para respuestas balanceadas
  temperature: 0.7,

  // Formateo markdown habilitado
  markdown: true,
};
```

### Instrucciones Dinámicas

```typescript
export function getChatInstructions(profileInfo: {
  displayName: string;
  title: string;
  bio: string;
}): string {
  return `Eres un assistente virtual amable y profesional de ${profileInfo.displayName}.

${profileInfo.title ? `- Título: ${profileInfo.title}` : ""}
${profileInfo.bio ? `- Bio: ${profileInfo.bio}` : ""}

Tu rol es:
1. Responder preguntas sobre servicios, precios, horarios y ubicación
2. Ayudar a pacientes a agendar citas
3. Proporcionar información básica (no diagnóstica)
4. Derivar al médico cuando sea necesario

**INSTRUCCIONES IMPORTANTES PARA RESPUESTAS ESTRUCTURADAS:**
[... JSON format examples ...]

**Flujo de agendamiento:**
1. Muestra servicios con JSON "services-list"
2. Cuando el usuario selecciona uno, muestra disponibilidad con JSON "availability"
3. Cuando selecciona fecha/hora, muestra el formulario de paciente con JSON "patient-form"
4. Tras completar datos, pide confirmación con JSON "confirmation"
5. Tras confirmar, muestra el resultado con JSON "reservation"

**Directrices generales:**
- Siempre sé amable, empático y profesional
- Usa un tono cercano pero formal
- No proporciones diagnósticos médicos - deriva al médico
- Para emergencias, recomienda llamar a emergencias (911)
- Mantén las respuestas concisas pero completas
- Usa los tools disponibles para obtener información actualizada`;
}
```

---

## Sistema de Memoria

### Configuración de Memoria

```typescript
// packages/api/src/services/ai/chat/memory/config.ts

import { Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import path from "node:path";

export function createChatMemory(): Memory {
  const dbPath = path.resolve(process.cwd(), ".voltagent/chat.db");

  const adapter = new LibSQLMemoryAdapter({
    url: `file:${dbPath}`,
  });

  return new Memory({
    storage: adapter,
  });
}

export function createWorkflowMemory(): Memory {
  const dbPath = path.resolve(process.cwd(), ".voltagent/workflows.db");

  const adapter = new LibSQLMemoryAdapter({
    url: `file:${dbPath}`,
  });

  return new Memory({
    storage: adapter,
  });
}
```

### Tipos de Memoria

| Tipo | Archivo | Propósito |
|------|---------|-----------|
| **Chat Memory** | `.voltagent/chat.db` | Historial de conversaciones |
| **Workflow Memory** | `.voltagent/workflows.db` | Flujos multi-step complejos |

### Uso de Memoria en el Agente

```typescript
// La memoria se adjunta al agente
const agent = new Agent({
  ...config,
  tools: [...],
  memory: createChatMemory(), // Persistent memory
});

// Al generar respuesta, se proporciona conversationId
const result = await agent.generateText(message, {
  conversationId,  // Segmenta la conversación
  context: new Map([
    ["userPhone", phone],
    ["channel", "web"],
    ["profileDisplayName", profileInfo.displayName],
    ["profileId", profileId],
  ]),
});
```

---

## Context Management

### Context Passing

El agente recibe contexto adicional a través de un `Map<string, unknown>`:

```typescript
const context = new Map([
  // Identificación del usuario
  ["userPhone", phone],
  ["channel", "web"],  // o "whatsapp"

  // Información del perfil (doctor)
  ["profileDisplayName", profileInfo.displayName],
  ["profileTitle", profileInfo.title],
  ["profileBio", profileInfo.bio],
  ["profileId", profileId],

  // Otros contextos
  ["userId", userId],
  ["conversationId", conversationId],
]);
```

### Context Keys Disponibles

| Key | Tipo | Propósito |
|-----|------|-----------|
| `userPhone` | string | Teléfono del usuario |
| `channel` | string | Canal de comunicación (web/whatsapp) |
| `profileDisplayName` | string | Nombre del profesional |
| `profileTitle` | string | Título del profesional |
| `profileBio` | string | Biografía del profesional |
| `profileId` | string | ID del perfil |
| `userId` | string | ID del usuario autenticado |
| `conversationId` | string | ID de la conversación |

### Inyección de Contexto en el Prompt

```typescript
// En packages/api/src/api/routes/agent.ts

// Obtener datos del perfil
const profile = await getProfile(profileId);

// Inyectar contexto en el mensaje del usuario
const messageWithContext = `
[CONTEXTO DEL PERFIL]
Profesional: ${profile.displayName}
${profile.title ? `Título: ${profile.title}` : ""}
${profile.bio ? `Bio: ${profile.bio}` : ""}

[MENSAJE DEL USUARIO]
${message}
`;

// Generar respuesta con contexto
const result = await agent.generateText(messageWithContext, {
  conversationId,
  context: new Map([
    ["profileId", profileId],
    ["profileDisplayName", profile.displayName],
  ]),
});
```

---

## Structured Responses

### Sistema de Respuestas Estructuradas

El agente devuelve respuestas en dos modos:

1. **Texto plano**: Para respuestas simples sin estructura
2. **JSON blocks**: Para componentes UI interactivos

### Schema de Respuestas

```typescript
// packages/api/src/services/ai/chat/schema.ts

// Text part
export const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

// Services list part
export const servicesPartSchema = z.object({
  type: z.literal("services-list"),
  title: z.string().optional().default("Nuestros Servicios"),
  intro: z.string().optional(),
  services: z.array(serviceItemSchema),
  category: z.string().optional(),
});

// Availability part
export const availabilityPartSchema = z.object({
  type: z.literal("availability"),
  date: z.string(), // YYYY-MM-DD
  slots: z.array(availabilitySlotSchema),
  serviceId: z.string(),
  serviceName: z.string().optional(),
});

// ... más schemas para reservation, faq, calendar, patient-form, confirmation

// Union de todos los parts
export const aiMessagePartSchema = z.union([
  textPartSchema,
  servicesPartSchema,
  availabilityPartSchema,
  reservationPartSchema,
  faqPartSchema,
  calendarPartSchema,
  patientFormPartSchema,
  confirmationPartSchema,
]);

// Response completo
export const chatResponseSchema = z.object({
  parts: z.array(aiMessagePartSchema),
});
```

### Parser de Respuestas

```typescript
// packages/api/src/services/ai/chat/parser.ts

export function parseStructuredResponse(text: string): ParseResult {
  const parts: AIMessagePart[] = [];
  const errors: ParseError[] = [];

  // Patrón para extraer JSON blocks: ```json ... ```
  const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/g;

  let lastIndex = 0;
  let match;

  while ((match = jsonBlockPattern.exec(text)) !== null) {
    // Texto antes del JSON como text part
    const textBefore = text.slice(lastIndex, match.index).trim();
    if (textBefore) {
      parts.push({ type: "text", text: textBefore });
    }

    // Parsear JSON
    try {
      const jsonContent = JSON.parse(match[1]);
      const result = chatResponseSchema.safeParse(jsonContent);

      if (result.success) {
        parts.push(...result.data.parts);
      } else {
        // Validation error
        errors.push({
          type: "schema-validation",
          message: formatZodError(result.error),
          context: `JSON block #${blockIndex}`,
        });
      }
    } catch (error) {
      // JSON parse error
      errors.push({
        type: "json-parse",
        message: error.message,
        context: `JSON block #${blockIndex}`,
      });
    }

    lastIndex = jsonBlockPattern.lastIndex;
  }

  // Texto restante después del último JSON
  const textAfter = text.slice(lastIndex).trim();
  if (textAfter) {
    parts.push({ type: "text", text: textAfter });
  }

  return { parts, errors };
}
```

### Flujo de Respuesta

```
LLM Output (Markdown with JSON)
         │
         ▼
    parseStructuredResponse()
         │
         ├── Extract JSON blocks
         ├── Parse JSON
         ├── Validate with Zod
         └── Return { parts, errors }
         │
         ▼
    Frontend MessageRenderer
         │
         └── Render each part
```

---

## API Routes

### POST /api/agent/chat

Respuesta única (non-streaming).

```typescript
// Request
{
  message: string;          // User message
  phone?: string;           // User phone (optional)
  conversationId?: string;  // Conversation ID
  profileId: string;        // Profile/doctor ID
}

// Response
{
  success: true;
  text: string;             // Plain text response
  usage?: {
    tokens: number;
    promptTokens: number;
    completionTokens: number;
  };
  parts?: AIMessagePart[];  // Structured UI parts
  hasStructuredResponse: boolean;
}
```

### POST /api/agent/stream

Streaming con Server-Sent Events.

```typescript
// Compatible con Vercel AI SDK useChat()
// Request: Same as /api/agent/chat

// Response: SSE stream
data: {"type":"text","text":"partial"}

// Final message contains parts:
data: {"type":"parts","parts":[...]}
```

### POST /api/agent/escalate

Escalado a operador humano.

```typescript
// Request
{
  conversationId: string;
  reason: string;
  phone?: string;
  notes?: string;
}

// Response
{
  success: true;
  paused: boolean;
  message: string;
}
```

### Profile Context Injection

```typescript
// En packages/api/src/api/routes/agent.ts

// Obtener datos del perfil
const profile = await business.profile.getProfile(profileId);

// Generar instrucciones dinámicas
const instructions = getChatInstructions({
  displayName: profile.displayName,
  title: profile.title || "",
  bio: profile.bio || "",
});

// Actualizar configuración del agente
agentConfig.instructions = instructions;

// Generar respuesta
const result = await agent.generateText(messageWithContext, {
  conversationId,
  context: new Map([
    ["profileId", profileId],
    ["profileDisplayName", profile.displayName],
  ]),
});
```

---

## WhatsApp Integration

### Dos Agentes

#### 1. Web Chat Agent (Full AI)

- **Ubicación**: `services/ai/chat/`
- **Capacidades**: Full tool access, structured responses
- **Modelo**: MiniMax M2.1 con VoltAgent
- **Use case**: Widget web del dashboard

#### 2. WhatsApp Agent (Lite)

- **Ubicación**: `services/ai/whatsapp-agent/webhooks.ts`
- **Capacidades**: Keyword-based routing, sin LLM
- **Use case**: Respuestas rápidas en WhatsApp

### WhatsApp Webhook Flow

```
POST /whatsapp/agent/webhook
         │
         ├── Filter: bot messages, groups, empty text
         │
         ├── Check context status
         │    ├── PAUSED_FOR_HUMAN → No responder
         │    └── TRANSFERRED_TO_WIDGET → Suggest transfer
         │
         ├── Keyword detection
         │    ├── Transfer keywords → Suggest web widget
         │    └── FAQ keywords → Quick FAQ response
         │
         └── Evolution API → Send WhatsApp message
```

### WhatsApp Context Schema

```sql
CREATE TABLE whatsapp_context (
  phone VARCHAR(20) PRIMARY KEY,
  profile_id UUID REFERENCES profile(id),
  conversation_history JSONB,
  context_summary TEXT,
  status ENUM ('ACTIVE', 'TRANSFERRED_TO_WIDGET', 'PAUSED_FOR_HUMAN'),
  last_interaction_at TIMESTAMP,
  patient_id UUID,
  transferred_to_widget_at TIMESTAMP,
  paused_for_human_at TIMESTAMP
);
```

### Handoff: WhatsApp → Web Widget

```typescript
// 1. Usuario en WhatsApp pide hablar con un humano
// 2. WhatsApp agent sugiere transferir al web widget
// 3. Usuario accede al widget web
// 4. Web agent carga contexto previo con load_whatsapp_context
```

```typescript
// En web agent
const context = await loadWhatsAppContextTool.execute({ phone });

if (context.found && context.canContinue) {
  // Continuar conversación con historial previo
  console.log("Continuing conversation:", context.summary);
}
```

### Repository de WhatsApp Context

```typescript
// packages/api/src/services/repository/whatsapp-context.ts

class WhatsAppContextRepository {
  async findByPhone(phone: string) { /* ... */ }
  async addMessage(phone: string, message: ConversationMessage) { /* ... */ }
  async markTransferredToWidget(phone: string) { /* ... */ }
  async markPausedForHuman(phone: string) { /* ... */ }
  async getContextForWidget(phone: string) { /* ... */ }
  async generateWidgetSummary(phone: string) { /* ... */ }
}
```

---

## Referencias

- **VoltAgent Framework**: `docs/ai-voltagent-guide.md`
- **Tools Reference**: `docs/ai-tools-reference.md`
- **UI Reference**: `docs/ai-ui-reference.md`
- **Source Code**: `packages/api/src/services/ai/chat/`
