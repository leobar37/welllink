# AGENTS.md - AI Services

> **Context file for AI agents working on the AI services layer**

## Overview

The `packages/api/src/services/ai` directory contains the AI-powered chat and messaging system for MediApp. It implements intelligent virtual assistants that handle patient interactions across multiple channels (WhatsApp and Web Chat), providing automated responses, appointment scheduling, FAQ handling, and patient management.

**Key Capabilities:**

- Multi-channel AI agents (WhatsApp + Web Chat)
- Structured response system with interactive components
- Patient management tools (lookup, create, label updates)
- Medical service catalog and appointment scheduling
- FAQ search with keyword matching
- Payment method information
- Human handoff for complex cases
- Persistent conversation memory with LibSQL

## Project Type & Stack

- **Type**: AI Agent System for Healthcare CRM
- **Main Language**: TypeScript
- **Runtime**: Bun
- **Framework**: ElysiaJS (for webhook handlers)
- **AI Framework**: VoltAgent (@voltagent/core)
- **LLM Provider**: MiniMax via vercel-minimax-ai-provider
- **Memory**: LibSQL (persistent conversation storage)

### Key Dependencies

| Package                      | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `@voltagent/core`            | Core AI agent framework (Agent, createTool, Memory) |
| `@voltagent/libsql`          | LibSQL adapter for persistent memory                |
| `vercel-minimax-ai-provider` | MiniMax LLM provider integration                    |
| `ai`                         | Vercel AI SDK (streaming, tool calling)             |
| `zod`                        | Schema validation for tool inputs/outputs           |
| `elysia`                     | Web framework for webhook endpoints                 |

## Architecture

The AI services layer follows a **modular, multi-channel architecture** with clear separation between:

1. **Core AI Agent** (`chat/`) - LLM-powered conversational AI
2. **Channel Adapters** (`messaging/`) - Platform-specific message formatting
3. **WhatsApp Integration** (`whatsapp-agent/`) - Evolution API webhook handlers
4. **Tool System** - Extensible tool-based capabilities

### Directory Structure

```
services/ai/
├── chat/                          # Core AI agent implementation
│   ├── index.ts                   # Public exports
│   ├── agent.ts                   # Agent factory & singleton
│   ├── config.ts                  # Agent configuration & system prompts
│   ├── schema.ts                  # Zod schemas for structured responses
│   ├── parser.ts                  # JSON response parser
│   ├── memory/
│   │   └── config.ts              # LibSQL memory adapters
│   └── tools/                     # AI agent tools
│       ├── index.ts               # Tool exports
│       ├── patient.ts             # Patient CRUD tools
│       ├── services.ts            # Medical service tools
│       ├── appointments.ts        # Reservation creation tool
│       ├── faq.ts                 # FAQ search tool
│       ├── payment-methods.ts     # Payment info tools
│       ├── whatsapp-context.ts    # WhatsApp context loader
│       └── pause-for-human.ts     # Human handoff tool
│
├── messaging/                     # Multi-channel message formatting
│   ├── index.ts                   # Public exports
│   ├── types.ts                   # Channel types & interfaces
│   ├── message-strategy.interface.ts  # Strategy pattern interface
│   ├── message-strategy.factory.ts    # Strategy factory
│   └── strategies/
│       ├── whatsapp.strategy.ts   # Plain text formatter (Evolution API)
│       └── webchat.strategy.ts    # JSON parts formatter (interactive UI)
│
└── whatsapp-agent/                # WhatsApp-specific agent
    ├── webhooks.ts                # Evolution API webhook handler
    └── tools/
        ├── index.ts               # WhatsApp tool exports
        ├── quick-faq.ts           # Fast FAQ responses
        └── suggest-transfer.ts    # Transfer to web chat
```

## Coding Patterns & Conventions

### Naming Conventions

| Element          | Pattern             | Example                                             |
| ---------------- | ------------------- | --------------------------------------------------- |
| Files            | kebab-case.ts       | `pause-for-human.ts`, `whatsapp.strategy.ts`        |
| Functions        | camelCase           | `createMedicalChatAgent()`, `getMessageStrategy()`  |
| Classes          | PascalCase          | `WhatsAppMessageStrategy`, `WebChatMessageStrategy` |
| Tools            | camelCase + suffix  | `getPatientTool`, `createReservationTool`           |
| Constants        | camelCase           | `chatAgentConfig`, `FALLBACK_MESSAGES`              |
| Types/Interfaces | PascalCase          | `MessageStrategy`, `FormattedMessage`               |
| Zod Schemas      | PascalCase + suffix | `PatientLookupInput`, `CreateReservationInput`      |

### Code Patterns

#### 1. Tool Definition Pattern

All AI tools follow a consistent pattern using VoltAgent's `createTool`:

```typescript
import { createTool } from "@voltagent/core";
import { z } from "zod";

// 1. Define input schema with Zod
const MyToolInput = z.object({
  param1: z.string().describe("Description for AI"),
  param2: z.number().optional(),
});

// 2. Create tool with createTool()
export const myTool = createTool({
  name: "tool_name", // snake_case, unique identifier
  description: "Clear description...", // What it does, when to use it
  parameters: MyToolInput,
  execute: async (params) => {
    try {
      // Implementation
      return { success: true, data: result };
    } catch (error) {
      return {
        error: true,
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  },
});
```

#### 2. Repository Access Pattern

Tools instantiate repositories directly (simple DI):

```typescript
// At module level - simple instantiation
const patientRepository = new PatientRepository();
const clientService = new ClientService(repository, noteRepository);

// In tool execute()
const result = await patientRepository.findByPhone(phone);
```

#### 3. Error Handling Pattern

Always return structured error objects (never throw):

```typescript
execute: async (params) => {
  try {
    // ... operation
    return { success: true, data: result };
  } catch (error) {
    return {
      error: true,
      message: `Operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
```

#### 4. Singleton Agent Pattern

The main agent uses singleton pattern for performance:

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

#### 5. Strategy Pattern for Multi-Channel

Message formatting uses Strategy pattern:

```typescript
// Interface
export interface MessageStrategy {
  readonly channel: ChannelType;
  formatResponse(agentText: string): FormattedMessage;
  supportsRichComponents(): boolean;
}

// Factory with singleton instances
const strategies: Record<ChannelType, MessageStrategy> = {
  whatsapp: new WhatsAppMessageStrategy(),
  webchat: new WebChatMessageStrategy(),
};

export function getMessageStrategy(channel: ChannelType): MessageStrategy {
  const strategy = strategies[channel];
  if (!strategy) throw new Error(`Channel '${channel}' not supported`);
  return strategy;
}
```

#### 6. Structured Response System

AI responses include embedded JSON for interactive UI components:

```typescript
// Agent generates markdown with JSON blocks
\`\`\`json
{
  "parts": [
    { "type": "text", "text": "Texto introductorio" },
    {
      "type": "services-list",
      "title": "Nuestros Servicios",
      "services": [...]
    }
  ]
}
\`\`\`
```

**Parser** (`parser.ts`) extracts and validates these JSON blocks.

### Zod Schema Patterns

All tool inputs use Zod with `.describe()` for AI context:

```typescript
const CreateReservationInput = z.object({
  profileId: z.string().describe("ID del perfil/doctor"),
  patientName: z.string().describe("Nombre completo del paciente"),
  preferredDate: z.string().describe("Fecha preferida en formato YYYY-MM-DD"),
  // ...
});
```

### Type Exports

Types are exported from `schema.ts` using Zod inference:

```typescript
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type AIMessagePart = z.infer<typeof aiMessagePartSchema>;
```

## Key Files

| File                                        | Purpose                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `chat/agent.ts`                             | Main AI agent factory with all tools configured                            |
| `chat/config.ts`                            | System prompts (Spanish), model config, response templates                 |
| `chat/schema.ts`                            | Zod schemas for 8 structured response types (services, availability, etc.) |
| `chat/parser.ts`                            | Extracts and validates JSON blocks from AI responses                       |
| `chat/memory/config.ts`                     | LibSQL adapters for conversation & workflow memory                         |
| `messaging/strategies/whatsapp.strategy.ts` | Converts structured responses to plain text for WhatsApp                   |
| `messaging/strategies/webchat.strategy.ts`  | Passes structured JSON to frontend for interactive components              |
| `whatsapp-agent/webhooks.ts`                | Evolution API webhook handler - main WhatsApp integration                  |
| `chat/tools/patient.ts`                     | Patient lookup, create, label update tools                                 |
| `chat/tools/appointments.ts`                | Creates reservation requests (pending status)                              |
| `chat/tools/faq.ts`                         | Keyword-based FAQ search with default fallback answers                     |

## Structured Response Types

The system supports 8 interactive component types:

| Type            | Use Case                  | WhatsApp Output                  |
| --------------- | ------------------------- | -------------------------------- |
| `text`          | Plain text content        | Plain text                       |
| `services-list` | Display service catalog   | Bullet list with prices/duration |
| `availability`  | Show available time slots | Date + time list                 |
| `reservation`   | Confirm appointment       | Confirmation details             |
| `faq`           | Display Q&A pairs         | Formatted Q&A                    |
| `calendar`      | Date picker prompt        | Text request for date            |
| `patient-form`  | Collect patient info      | Fields needed                    |
| `confirmation`  | Yes/no confirmation       | Action buttons (text)            |

## Important Notes for Agents

### ⚠️ Critical Context

1. **Language**: System prompts and AI responses are in **Spanish** (patients are Spanish-speaking)

2. **Response Conciseness**: The system prompt emphasizes VERY SHORT responses (1-2 sentences max before JSON). Never repeat info shown in structured components.

3. **Tool Registration**: When adding new tools:
   - Define in appropriate `tools/` file
   - Export from `tools/index.ts`
   - Import and add to `createMedicalChatAgent()` in `agent.ts`

4. **WhatsApp Limitations**:
   - Max 4096 characters per message (enforced in WhatsApp strategy)
   - No rich components - converted to plain text with emojis
   - Evolution API for sending messages

5. **Channel Differences**:
   - **WebChat**: Supports interactive components (calendar, forms, buttons)
   - **WhatsApp**: Text only, transfers to WebChat for complex flows

6. **Memory Persistence**:
   - Conversations stored in `.voltagent/chat.db` (LibSQL)
   - Workflows in `.voltagent/workflows.db`
   - Uses conversation ID format: `whatsapp:{profileId}:{phone}`

7. **Error Handling**:
   - Tools must NEVER throw - always return error objects
   - Webhook has fallback messages for AI failures
   - Parser gracefully handles invalid JSON

8. **Profile Context**:
   - All tools require `profileId` for data scoping
   - WhatsApp webhooks look up profile by `instanceName`

### Common Pitfalls

- ❌ Don't add tools without registering them in `agent.ts`
- ❌ Don't throw errors in tool execute functions
- ❌ Don't forget `.describe()` on Zod fields (AI needs context)
- ❌ Don't modify system prompts without checking frontend component compatibility
- ❌ Don't use rich components in WhatsApp-only flows (they get converted to text)
- ✅ Always use try/catch in tool execute functions
- ✅ Always provide clear tool descriptions (AI decides when to use them)
- ✅ Test both WebChat and WhatsApp formatting when changing response structure

### Multi-Channel Flow

```
User (WhatsApp)
    ↓
Evolution API Webhook
    ↓
Message Aggregator (batch rapid messages)
    ↓
AI Agent.generateText()
    ↓
Message Strategy.formatResponse()
    ├─ WhatsApp → Plain text
    └─ WebChat → JSON parts
    ↓
Channel-specific output
```

### Dependencies

#### Internal

- `services/repository/*` - Data access layer (Patient, Profile, MedicalService, etc.)
- `services/business/*` - Business logic (ClientService, EvolutionService)
- `db/schema/*` - Database types and enums
- `config/env` - Environment variables

#### External

- `@voltagent/core` - AI agent framework
- `@voltagent/libsql` - Memory persistence
- `vercel-minimax-ai-provider` - LLM provider
- `zod` - Schema validation
- `elysia` - Web framework

## Build & Development

```bash
# From packages/api directory
bun install              # Install dependencies
bun run dev              # Start dev server with hot reload
bun run lint             # TypeScript type checking
bun run build            # Production build
```

## Testing Tools

When adding new tools, test with:

1. Direct tool invocation (unit test)
2. Integration via chat endpoint
3. Both WebChat and WhatsApp formatting
4. Error scenarios (invalid inputs, missing data)

## Related Documentation

- [Global PRD](../../docs/global-prd.md) - Product requirements (Spanish)
- [Module 1](../../docs/modules/01-auth-onboarding.md) - Auth & onboarding
- [Module 4](../../docs/modules/04-features.md) - Feature system
- VoltAgent docs: https://docs.voltagent.dev/
- MiniMax provider: Custom vercel-minimax-ai-provider package
