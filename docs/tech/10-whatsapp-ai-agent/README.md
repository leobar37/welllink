# WhatsApp AI Agent Integration

## Overview

This module implements an automated WhatsApp AI agent that provides quick responses to users and seamlessly transfers complex queries to the chat widget. The system includes a "human in the loop" feature that allows users to request human attention, generating a direct WhatsApp link to the doctor.

### Key Features

- **Quick FAQ Responses**: Automated answers for common questions (hours, prices, location, services)
- **Smart Transfer**: Detects when a conversation requires the chat widget and generates transfer links
- **Context Persistence**: Stores conversation history in the database to maintain context when users transfer to the chat widget
- **Human in the Loop**: Users can request human attention, which pauses the automated agent and generates a direct WhatsApp link to the doctor
- **Phone-Based Identification**: Uses phone number as the primary identifier to link WhatsApp conversations with patient records

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WHATSAPP AI AGENT FLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐│
│  │   WhatsApp User  │────▶│  Evolution API   │────▶│  Webhook Handler ││
│  └──────────────────┘     │   Webhook        │     │  (whatsapp-agent)││
│                          └──────────────────┘     └────────┬─────────┘│
│                                                            │           │
│                          ┌──────────────────┐              │           │
│                          │  Quick FAQ Check │              │           │
│                          └────────┬─────────┘              │           │
│                                   │                        │           │
│              ┌────────────────────┼────────────────────┐   │           │
│              │                    │                    │   │           │
│              ▼                    ▼                    ▼   │           │
│      ┌───────────────┐   ┌───────────────┐   ┌───────────────┐  │           │
│      │  Answer FAQ   │   │  Transfer to  │   │  Transfer to  │  │           │
│      │  (horarios,   │   │  Chat Widget  │   │    Human      │  │           │
│      │   precios)    │   │  (agendar,    │   │  (pause agent │  │           │
│      │               │   │   reservar)   │   │   + WA link)  │  │           │
│      └───────────────┘   └───────┬───────┘   └───────────────┘  │           │
│                                  │                              │           │
│                                  ▼                              │           │
│                          ┌───────────────┐                      │           │
│                          │ WhatsApp      │◀─────────────────────┘           │
│                          │ Context (DB)  │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│                                  ▼                                          │
│                          ┌───────────────┐                                  │
│                          │  Chat Widget  │◀─────────────────────────────────┘
│                          │  (web/chat)   │
│                          └───────────────┘
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component                   | Location                                        | Purpose                         |
| --------------------------- | ----------------------------------------------- | ------------------------------- |
| Webhook Handler             | `services/ai/whatsapp-agent/webhooks.ts`        | Receives Evolution API webhooks |
| WhatsApp Context Repository | `services/repository/whatsapp-context.ts`       | Manages conversation context    |
| Quick FAQ Tool              | `services/ai/whatsapp-agent/tools/quick-faq.ts` | Answers common questions        |
| Load WhatsApp Context Tool  | `services/ai/chat/tools/whatsapp-context.ts`    | Loads context in chat widget    |
| Pause for Human Tool        | `services/ai/chat/tools/pause-for-human.ts`     | Generates direct WhatsApp link  |

---

## Database Schema

### whatsapp_context Table

```typescript
// packages/api/src/db/schema/whatsapp-context.ts

export const whatsappContext = pgTable("whatsapp_context", {
  // Primary key - phone number uniquely identifies the conversation
  phone: varchar("phone", { length: 20 }).primaryKey(),

  // Profile reference (which doctor's WhatsApp)
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),

  // Conversation history as JSON array
  conversationHistory: jsonb("conversation_history")
    .$type<
      Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: number;
      }>
    >()
    .default([]),

  // Summary for chat widget
  contextSummary: text("context_summary"),

  // Last interaction timestamp
  lastInteractionAt: timestamp("last_interaction_at"),

  // Status: ACTIVE | TRANSFERRED_TO_WIDGET | PAUSED_FOR_HUMAN
  status: text("status", {
    enum: Object.values(WhatsAppContextStatus),
  })
    .notNull()
    .default(WhatsAppContextStatus.ACTIVE),

  // Timestamps for tracking
  transferredToWidgetAt: timestamp("transferred_to_widget_at"),
  pausedForHumanAt: timestamp("paused_for_human_at"),

  // Linked patient (nullable until identified)
  patientId: uuid("patient_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Status Values

| Status                  | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `ACTIVE`                | Conversation is active, agent responds normally |
| `TRANSFERRED_TO_WIDGET` | User transferred to chat widget                 |
| `PAUSED_FOR_HUMAN`      | User requested human attention; agent is paused |

---

## Backend Implementation

### Webhook Handler

**Location**: `packages/api/src/services/ai/whatsapp-agent/webhooks.ts`

The webhook handler processes incoming messages from Evolution API:

```typescript
export const whatsappAgentWebhook = new Elysia({
  prefix: "/whatsapp/agent",
}).post("/webhook", async ({ request }) => {
  // 1. Parse webhook payload
  // 2. Filter out self messages and group messages
  // 3. Check context status (skip if PAUSED_FOR_HUMAN)
  // 4. Add message to context
  // 5. Analyze message for transfer keywords
  // 6. Return FAQ or transfer link
});
```

**Transfer Keywords**: The agent detects when to transfer based on keywords:

- `cita`, `agendar`, `reservar` (appointment-related)
- `horario`, `disponible` (scheduling)
- `precio`, `consulta` (information requiring personalized response)

### Quick FAQ Responses

The agent provides instant responses for common queries:

```typescript
const quickFAQResponses: Record<string, string> = {
  horarios:
    "Nuestros horarios son Lunes a Viernes 9:00-18:00 y Sábados 9:00-13:00. ¿Te gustaría agendar una cita?",
  precios:
    "Los precios varían según el servicio. Puedo mostrarte nuestra lista de servicios con precios. ¿Te gustaría verla?",
  ubicacion:
    "Nuestra dirección y enlace a Google Maps están en nuestro perfil público. ¿Te los envío?",
  servicios:
    "Ofrecemos consultas generales, especialidades y más. ¿Te gustaría ver nuestra lista completa de servicios?",
  contacto:
    "Puedes contactarnos aquí mismo por WhatsApp. ¿En qué puedo ayudarte hoy?",
  general:
    "¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre horarios, precios, ubicación o agendar una cita.",
};
```

### Chat Widget Tools

#### Load WhatsApp Context

**Location**: `packages/api/src/services/ai/chat/tools/whatsapp-context.ts`

When a user arrives from WhatsApp, the chat widget loads their conversation history:

```typescript
export const loadWhatsAppContextTool = createTool({
  name: "load_whatsapp_context",
  parameters: z.object({
    phone: z.string().describe("Número de teléfono del usuario"),
  }),
  execute: async ({ phone }) => {
    const context = await repository.findByPhone(phone);

    if (!context) {
      return { found: false, isNewConversation: true };
    }

    return {
      found: true,
      status: context.status,
      history: context.conversationHistory,
      summary: context.contextSummary,
      patientId: context.patientId,
      canContinue: true,
    };
  },
});
```

#### Pause for Human (Human in the Loop)

**Location**: `packages/api/src/services/ai/chat/tools/pause-for-human.ts`

When the user requests human attention:

```typescript
export const pauseForHumanTool = createTool({
  name: "pause_for_human",
  parameters: z.object({
    phone: z.string().describe("Número de teléfono del usuario"),
    reason: z.string().describe("Razón por la que se necesita atención humana"),
  }),
  execute: async ({ phone, reason }) => {
    // 1. Pause the WhatsApp context
    await contextRepository.markPausedForHuman(phone);

    // 2. Generate direct WhatsApp link to doctor
    const message = encodeURIComponent(
      `🆘 Atención Humana Requerida\n\nTeléfono: ${phone}\nMotivo: ${reason}`,
    );
    const directWhatsAppLink = `https://wa.me/${doctorNumber}?text=${message}`;

    return {
      action: "pause_for_human",
      directWhatsAppLink,
      message:
        "Te transferimos a WhatsApp donde un doctor te atenderá directamente.",
      whatsappPaused: true,
    };
  },
});
```

---

## Configuration

### Environment Variables

**Location**: `packages/api/src/config/env.ts`

```typescript
interface EnvConfig {
  // ... existing variables

  // Web URL (for generating transfer links)
  WEB_URL: string;
}
```

**`.env` file**:

```env
WEB_URL=http://localhost:5176
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_api_key
```

### Evolution API Webhook Configuration

Configure the webhook in Evolution API dashboard:

```
Webhook URL: https://your-domain.com/whatsapp/agent/webhook
Events: MESSAGES_UPSERT
```

---

## Frontend Integration

### Chat Widget Updates

The chat widget needs to:

1. **Detect WhatsApp Origin**: Parse `?from=whatsapp&phone=+51...` from URL
2. **Load Context**: When user arrives from WhatsApp, call `load_whatsapp_context` tool
3. **Render Transfer Links**: Display WhatsApp links as clickable buttons when agent returns them
4. **Show Context Banner**: Indicate "Continuing conversation from WhatsApp"

### URL Parameters

| Parameter        | Description                                       |
| ---------------- | ------------------------------------------------- |
| `from`           | Set to `whatsapp` when user arrives from WhatsApp |
| `phone`          | User's phone number for loading context           |
| `conversationId` | Optional conversation identifier                  |

### Example Transfer Link

```
https://your-domain.com/dr-smith/chat?from=whatsapp&phone=51987654321
```

---

## Usage Scenarios

### Scenario 1: Quick FAQ

```
User: "¿Tienen horarios disponibles mañana?"
Agent: "Nuestros horarios son Lunes a Viernes 9:00-18:00 y Sábados 9:00-13:00.
       ¿Te gustaría agendar una cita?"
```

### Scenario 2: Transfer to Chat Widget

```
User: "Quiero agendar una consulta para mañana"
Agent: "Para esto es mejor que conversemos directamente.
       Te paso a nuestro chat donde podrás agendar tu cita con calma.

       https://your-domain.com/dr-smith/chat?from=whatsapp&phone=51987654321"
```

### Scenario 3: Human in the Loop

```
User: "Prefiero hablar con un humano"
Agent: "He pausado la atención automatizada.

       El doctor te atenderá directamente:
       https://wa.me/51999999999?text=🆘%20Atención%20Humana%20Requerida..."
```

---

## API Endpoints

### WhatsApp Agent Webhook

```
POST /whatsapp/agent/webhook
Content-Type: application/json

{
  "event": "MESSAGES_UPSERT",
  "instance": "dr-smith-instance",
  "data": {
    "key": {
      "id": "ABC123",
      "remoteJid": "51987654321@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Hola, tengo una pregunta"
    }
  }
}
```

---

## Migration

### Database Migration

Run the following migration to create the `whatsapp_context` table:

```sql
CREATE TABLE IF NOT EXISTS whatsapp_context (
  phone VARCHAR(20) PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  conversation_history JSONB DEFAULT '[]',
  context_summary TEXT,
  last_interaction_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  transferred_to_widget_at TIMESTAMP,
  paused_for_human_at TIMESTAMP,
  patient_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_context_profile_id_idx ON whatsapp_context(profile_id);
CREATE INDEX IF NOT EXISTS whatsapp_context_status_idx ON whatsapp_context(status);
CREATE INDEX IF NOT EXISTS whatsapp_context_patient_id_idx ON whatsapp_context(patient_id);
```

---

## Security Considerations

1. **Phone Number Privacy**: Store phone numbers securely and only access when necessary
2. **Context Isolation**: Ensure users can only access their own conversation context
3. **Webhook Verification**: Validate webhook payloads come from Evolution API
4. **Human Transfer**: Do not expose doctor's personal number directly; use proper messaging

---

## Future Enhancements

- [ ] Voice note support for WhatsApp
- [ ] Multi-language FAQ responses
- [ ] Rich message templates (cards, buttons)
- [ ] Conversation analytics dashboard
- [ ] Automated follow-up messaging
- [ ] Integration with CRM for patient matching
