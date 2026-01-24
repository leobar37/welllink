# VoltAgent Framework Guide

Guía completa del framework **VoltAgent** para construir agentes de IA en TypeScript. Basada en la documentación oficial: https://github.com/VoltAgent/voltagent y https://voltagent.dev/docs

## Índice

1. [Introducción](#introducción)
2. [Conceptos Core](#conceptos-core)
3. [Creación de Agentes](#creación-de-agentes)
4. [Herramientas (Tools)](#herramientas-tools)
5. [Sistema de Memoria](#sistema-de-memoria)
6. [Respuestas Estructuradas](#respuestas-estructuradas)
7. [Multi-Agent Systems](#multi-agent-systems)
8. [Workflows](#workflows)
9. [Guardrails](#guardrails)
10. [Hooks](#hooks)
11. [RAG](#rag)
12. [Observabilidad](#observabilidad)

---

## Introducción

**VoltAgent** es un framework TypeScript open-source para construir, orquestar y observar agentes de IA sofisticados.

### Características Principales

- **Code-first approach**: Familiar para desarrolladores JS/TS
- **Type Safety**: TypeScript con tipado completo
- **Provider-agnostic**: Soporta 80+ proveedores (OpenAI, Anthropic, etc.)
- **Modular**: Componentes con separación de preocupaciones clara
- **Observabilidad**: Integración con VoltOps Platform
- **RAG Built-in**: Retrieval Augmented Generation nativo

### Stack en Wellness-Link

```json
{
  "@voltagent/core": "^2.1.6",
  "@voltagent/libsql": "^2.0.3",
  "ai": "^6.0.26",
  "vercel-minimax-ai-provider": "^0.0.2"
}
```

---

## Conceptos Core

### Arquitectura del Agent

```
┌─────────────────────────────────────────────────────────┐
│                      Agent                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ToolManager  │  │MemoryManager │  │SubAgentMgr   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │HistoryMgr    │  │ EventEmitter │  │   Config     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Componentes Internos

| Componente | Responsabilidad |
|------------|-----------------|
| **ToolManager** | Almacena y gestiona herramientas |
| **MemoryManager** | Interfaz con almacenamiento persistente |
| **SubAgentManager** | Gestiona delegación a sub-agentes |
| **HistoryManager** | Registra historial de interacciones |
| **AgentEventEmitter** | Eventos para observabilidad |

---

## Creación de Agentes

### Agente Básico

```typescript
import { Agent } from "@voltagent/core";

const agent = new Agent({
  name: "my-agent",
  description: "Un asistente útil",
  instructions: "Eres un asistente útil y amable",
  model: "openai/gpt-4o-mini", // o provider instance
});
```

### Configuración Completa

```typescript
import { Agent } from "@voltagent/core";
import { openai } from "@ai-sdk/openai";

const agent = new Agent({
  // Identidad
  name: "medical-assistant",
  description: "Asistente médico para citas",

  // Comportamiento
  instructions: getDynamicInstructions(profileData),
  model: openai("gpt-4o-mini"),
  temperature: 0.7,
  maxSteps: 10,

  // Herramientas
  tools: [getPatientTool, listServicesTool],

  // Memoria
  memory: createChatMemory(),

  // Sub-agentes
  subAgents: [specialistAgent],

  // Hooks de ciclo de vida
  hooks: {
    onStart: async ({ agent, context }) => {
      console.log(`Agent ${agent.name} iniciado`);
    },
  },
});
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
```

**Por qué usar singleton:**
- Performance: Evita recrear el agente en cada request
- Tools se registran una sola vez
- Memory se adjunta una vez

---

## Herramientas (Tools)

### Creación de Tools

```typescript
import { createTool } from "@voltagent/core";
import { z } from "zod";

const myTool = createTool({
  name: "tool_name",
  description: "Describe qué hace la herramienta y cuándo usarla",
  parameters: z.object({
    param1: z.string().describe("Descripción del parámetro"),
    param2: z.number().optional().describe("Parámetro opcional"),
  }),
  execute: async ({ param1, param2 }, options) => {
    // options.signal es AbortSignal para cancelación
    return { result: "valor" };
  },
});
```

### Best Practices para Tools

1. **Nombres descriptivos**: Usa verbos (`search_web`, `send_email`)
2. **Descripciones detalladas**: Explica propósito y cuándo usarla
3. **Describe parámetros**: Usa `.describe()` en campos Zod
4. **Manejo de errores**: Try/catch con retornos estructurados
5. **AbortSignal**: Soporta cancelación con `options.signal`

### Tool Hooks

```typescript
const tool = createTool({
  name: "normalize_text",
  execute: async (args, options) => { /* ... */ },
  hooks: {
    onStart: ({ tool, args }) => {
      console.log(`Tool ${tool.name} iniciando`);
    },
    onEnd: ({ output }) => {
      // Puedes modificar el output
      if (typeof output === "string" && output.length > 1000) {
        return { output: output.slice(0, 1000) };
      }
    },
  },
});
```

### Tool Routing

Mantiene los prompts pequeños exponiendo solo herramientas relevantes:

```typescript
const agent = new Agent({
  model: "openai/gpt-4o-mini",
  tools: [weatherTool, financeTool, newsTool], // 50+ tools
  toolRouting: {
    embedding: "openai/text-embedding-3-small",
    topK: 3, // Solo expone las 3 más relevantes
  },
});
```

---

## Sistema de Memoria

### Memoria Básica con LibSQL

```typescript
import { Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";

const memory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/chat.db", // SQLite local
    // o url: process.env.TURSO_DATABASE_URL, // Turso cloud
  }),
});
```

### Working Memory (Contexto Estructurado)

**Formato JSON Schema:**

```typescript
import { z } from "zod";

const workingMemorySchema = z.object({
  userProfile: z.object({
    name: z.string().optional(),
    preferences: z.array(z.string()).optional(),
  }),
  context: z.object({
    currentGoal: z.string().optional(),
    notes: z.array(z.string()).optional(),
  }),
});

const memory = new Memory({
  storage: new LibSQLMemoryAdapter(),
  workingMemory: {
    enabled: true,
    scope: "user", // o "conversation"
    schema: workingMemorySchema,
  },
});
```

**Formato Template:**

```typescript
const template = `
## Usuario
- Nombre: {name}
- Preferencias: {preferences}

## Contexto
{context}
`;

const memory = new Memory({
  storage: new LibSQLMemoryAdapter(),
  workingMemory: {
    enabled: true,
    scope: "conversation",
    template,
  },
});
```

### Memory con Vector Search

```typescript
import { AiSdkEmbeddingAdapter, InMemoryVectorAdapter } from "@voltagent/core";
import { openai } from "@ai-sdk/openai";

const memory = new Memory({
  storage: new LibSQLMemoryAdapter(),
  embedding: new AiSdkEmbeddingAdapter(
    openai.embeddingModel("text-embedding-3-small")
  ),
  vector: new InMemoryVectorAdapter(),
});
```

---

## Respuestas Estructuradas

### Sistema de Partes

El agente devuelve respuestas en dos modos:

1. **Texto plano**: Simple conversación
2. **Estructurado**: JSON blocks con componentes UI

### Formato de Respuesta Estructurada

```typescript
// El LLM genera markdown con JSON blocks:
// ```json
// {
//   "parts": [
//     { "type": "text", "text": "Texto introductorio" },
//     { "type": "services-list", "services": [...] }
//   ]
// }
// ```

### Parser de Respuestas

```typescript
export function parseStructuredResponse(text: string): ParseResult {
  const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/g;
  // Extrae JSON, valida con Zod, retorna partes
}
```

### Tipos de Partes Soportadas

```typescript
type AIMessagePart =
  | { type: "text", text: string }
  | { type: "services-list", services: ServiceItem[] }
  | { type: "availability", slots: AvailabilitySlot[] }
  | { type: "reservation", reservation: ReservationItem }
  | { type: "faq", faqs: FAQItem[] }
  | { type: "calendar", serviceId, minDate, maxDate }
  | { type: "patient-form", serviceId, slotId, date, time }
  | { type: "confirmation", action, data };
```

---

## Multi-Agent Systems

### Supervisor Pattern

```typescript
const researcher = new Agent({
  name: "WebResearcher",
  purpose: "Busca información en la web eficientemente",
  model: openai("gpt-4o-mini"),
  tools: [webSearchTool],
});

const supervisor = new Agent({
  name: "ResearchCoordinator",
  instructions: "Coordina tareas de investigación",
  model: openai("gpt-4o"),
  subAgents: [researcher],
});
```

### Cómo Funciona la Delegación

1. Usuario envía request al supervisor
2. Supervisor decide qué sub-agente usar
3. `SubAgentManager` crea tool `delegate_task` automáticamente
4. Supervisor llama `delegate_task(task, targetAgents, context)`
5. Sub-agente se ejecuta con contexto aislado
6. Sub-agente retorna resultado
7. Supervisor formatea respuesta final

### Propiedades de Sub-Agentes

```typescript
const specialist = new Agent({
  name: "CardiologySpecialist",
  purpose: "Especialista en cardiología", // Para decisiones del supervisor
  instructions: "Instrucciones detalladas...",
  tools: [cardiologySpecificTools],
  memory: separateMemoryConfig,
});
```

---

## Workflows

### Workflow Chain

```typescript
import { createWorkflowChain } from "@voltagent/core";

const orderWorkflow = createWorkflowChain({
  id: "order-processing",
  name: "Order Processing",
  input: z.object({
    orderId: z.string(),
    amount: z.number(),
  }),
  result: z.object({
    status: z.enum(["approved", "rejected"]),
  }),
})
  .andThen({
    id: "validate",
    execute: async ({ data }) => ({
      ...data,
      isValid: data.amount > 0,
    }),
  })
  .andAgent(
    ({ data }) => `Analiza orden ${data.orderId} para fraude.`,
    analysisAgent,
    { schema: z.object({ riskLevel: z.string() }) }
  )
  .andThen({
    id: "decide",
    execute: async ({ data, getStepData }) => {
      const validation = getStepData("validate")?.output;
      return {
        status: validation?.isValid ? "approved" : "rejected",
      };
    },
  });
```

### Métodos de Workflow

| Método | Propósito |
|--------|---------|
| `.andThen()` | Ejecutar lógica custom |
| `.andAgent()` | Usar agente AI para un step |
| `.andWhen()` | Branching condicional |
| `.andAll()` | Ejecución paralela |
| `.andRace()` | Primero en ganar |
| `.andSleep()` | Pausar por duración |

### Human-in-the-Loop

```typescript
.andThen({
  id: "manager-approval",
  resumeSchema: z.object({
    approved: z.boolean(),
    managerId: z.string(),
  }),
  execute: async ({ data, suspend, resumeData }) => {
    if (resumeData) {
      return { ...data, approved: resumeData.approved };
    }

    if (data.amount > 500) {
      await suspend("Manager approval required", {
        requestedAmount: data.amount,
      });
    }

    return { ...data, approved: true };
  },
});
```

---

## Guardrails

### Input Guardrails

```typescript
import { createDefaultInputSafetyGuardrails } from "@voltagent/core";

const agent = new Agent({
  inputGuardrails: createDefaultInputSafetyGuardrails(),
  // Bloquea: profanity, injection attacks, etc.
});
```

### Custom Input Guardrail

```typescript
import { createInputGuardrail } from "@voltagent/core";

const topicBlocker = createInputGuardrail({
  id: "topic-blocker",
  handler: async ({ input }) => {
    const blockedTopics = ["illegal", "hacking"];
    for (const topic of blockedTopics) {
      if (input.toLowerCase().includes(topic)) {
        return {
          pass: false,
          message: `No puedo ayudar con "${topic}"`,
        };
      }
    }
    return { pass: true };
  },
});
```

### Output Guardrails

```typescript
import { createSensitiveNumberGuardrail, createMaxLengthGuardrail } from "@voltagent/core";

const agent = new Agent({
  outputGuardrails: [
    createSensitiveNumberGuardrail({ replacement: "[REDACTED]" }),
    createMaxLengthGuardrail({ maxCharacters: 1000 }),
  ],
});
```

---

## Hooks

### Hooks Disponibles

| Hook | Cuándo se dispara |
|------|-------------------|
| `onStart` | El agente comienza a procesar |
| `onPrepareMessages` | Antes de enviar mensajes al LLM |
| `onToolStart` | Antes de ejecutar herramienta |
| `onToolEnd` | Después de ejecutar herramienta |
| `onEnd` | El agente termina de procesar |
| `onHandoff` | Agente hace handoff a otro |

### Ejemplo de Hooks

```typescript
const agent = new Agent({
  model: openai("gpt-4o-mini"),
  hooks: {
    onStart: async ({ agent, context }) => {
      console.log(`Agent ${agent.name} iniciado`);
    },
    onToolStart: async ({ tool, args, context }) => {
      // Bloquear tools basado en condiciones
      if (tool.name === "expensive_tool" && context.userId === "guest") {
        throw new ToolDeniedError({
          toolName: tool.name,
          message: "Plan Pro requerido",
          code: "TOOL_FORBIDDEN",
          httpStatus: 403,
        });
      }
    },
    onPrepareMessages: async ({ messages }) => {
      // Transformar mensajes antes del LLM
      const enhanced = messages.map(msg =>
        addTimestampToMessage(msg, new Date().toISOString())
      );
      return { messages: enhanced };
    },
  },
});
```

---

## RAG

### Retriever Básico

```typescript
import { BaseRetriever } from "@voltagent/core";

class SimpleRetriever extends BaseRetriever {
  private documents: Array<{ title: string; content: string }>;

  async retrieve(input: string | BaseMessage[]): Promise<string> {
    const searchText = typeof input === "string" ? input : input[0].content;
    const matchedDocs = this.documents.filter(doc =>
      doc.content.toLowerCase().includes(searchText.toLowerCase())
    );
    return matchedDocs.map(doc =>
      `Title: ${doc.title}\nContent: ${doc.content}`
    ).join("\n\n");
  }
}

const agent = new Agent({
  model: openai("gpt-4o-mini"),
  retriever: simpleRetriever,
});
```

### Retriever como Tool

```typescript
const agent = new Agent({
  model: openai("gpt-4o-mini"),
  tools: [retriever.tool], // Búsqueda bajo demanda
});
```

---

## Observabilidad

### Event System

VoltAgent tiene un sistema de eventos integrado para observabilidad:

```typescript
agent.on("start", (event) => {
  console.log("Agent started:", event.agentId);
});

agent.on("toolEnd", (event) => {
  console.log("Tool executed:", event.toolName, event.duration);
});
```

### VoltOps Platform

- **Tracing**: Flowcharts visuales de workflows
- **Event Tracking**: Logging granular
- **Metrics**: Latencia, token usage, tool calls
- **Multi-Agent Viz**: Relaciones supervisor/sub-agente

### Local Development Server

```bash
npm run dev
# Server en http://localhost:3141
# Swagger UI: http://localhost:3141/ui
# Test con: https://console.voltagent.dev
```

---

## Providers Soportados

### Usar Model Strings

```typescript
const agent = new Agent({
  model: "openai/gpt-4o-mini", // Formato string
});
```

### Usar AI SDK

```typescript
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { openai } from "@ai-sdk/openai";

const agent = new Agent({
  model: openai("gpt-4o-mini"), // AI SDK instance
});
```

### Providers Disponibles

- **OpenAI**: GPT-4o, GPT-4o-mini, o1, o1-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Fireworks**: Mixtral, Llama 3
- **Groq**: Llama 3 70b, Mixtral
- **Together AI**: 100+ modelos
- **80+ providers**: Ver documentación completa

---

## Best Practices

### 1. Design de Agentes

- Usa nombres y descripciones claras y específicas
- Mantén instructions enfocadas y scoped
- Usa sub-agentes para tareas especializadas
- Working memory para contexto estructurado

### 2. Creación de Tools

- Proporciona descripciones detalladas para el LLM
- Usa `.describe()` de Zod para parámetros
- Implementa manejo de errores y AbortSignal
- Retorna datos estructurados para parsing fácil

### 3. Memory Management

- Configura `contextLimit` apropiado
- Usa `conversationId` para segmentación
- Considera Turso para producción
- Vector search para recuperación semántica

### 4. Workflow Design

- Divide tareas complejas en steps claros
- Human-in-the-loop para decisiones críticas
- Maneja errores con fallbacks
- Testea cada step independientemente

### 5. Observabilidad

- Usa hooks para logging y monitoring
- VoltOps para tracing en desarrollo
- Event tracking apropiado
- Monitorea token usage y performance

### 6. Seguridad

- Input guardrails para contenido dañino
- Output guardrails para datos sensibles
- Valida y sanitiza inputs de tools
- Authentication/authorization apropiados

---

## Referencias

- **Documentación Oficial**: https://voltagent.dev/docs
- **GitHub**: https://github.com/VoltAgent/voltagent
- **VoltOps Console**: https://console.voltagent.dev
- **AI SDK Vercel**: https://sdk.vercel.ai/docs
- **Implementation en Wellness-Link**: Ver `docs/ai-agent-reference.md`
