# AI UI Reference

Guía completa del sistema UI para respuestas de IA en Wellness-Link.

## Índice

1. [Arquitectura del Sistema UI](#arquitectura-del-sistema-ui)
2. [Tipos de Partes](#tipos-de-partes)
3. [Factory Pattern](#factory-pattern)
4. [Handler Callbacks](#handler-callbacks)
5. [Componentes Implementados](#componentes-implementados)
6. [Chat Widget System](#chat-widget-system)
7. [Cómo Agregar Nuevas Partes](#cómo-agregar-nuevas-partes)

---

## Arquitectura del Sistema UI

### Part-Based UI System

El sistema usa un patrón de "partes" para renderizar diferentes tipos de contenido generado por la IA.

```
AI Response (String with JSON blocks)
              │
              ▼
        parseStructuredResponse()
              │
              ▼
       AIMessagePart[]  (Array de partes)
              │
              ▼
       MessageRenderer  (Factory)
              │
      ┌─────────┴─────────┐
      ▼                   ▼
 PartRenderer         PartRenderer
   (type: text)       (type: services-list)
      │                   │
      ▼                   ▼
  TextPart          ServicesPart
```

### Archivos del Sistema UI

```
packages/web/src/components/ai-ui/
├── types.ts           # TypeScript types e interfaces
├── factory.tsx        # MessageRenderer y PartRenderer
├── text-part.tsx      # Text content component
├── services-part.tsx  # Services carousel
├── availability-part.tsx   # Time slots grid
├── reservation-part.tsx    # Reservation confirmation
├── faq-part.tsx       # FAQ list
├── calendar-part.tsx  # Date picker
├── patient-form-part.tsx   # Patient data form
└── confirmation-part.tsx  # Confirmation dialog
```

---

## Tipos de Partes

### BaseAIPart

Todas las partes extienden esta interfaz base:

```typescript
export interface BaseAIPart {
  id?: string;              // Para React keys
  readonly type: string;    // Discriminator para union types
}
```

### Tipos de Partes Soportadas

#### 1. TextAIPart

Texto plano de la IA.

```typescript
export interface TextAIPart extends BaseAIPart {
  readonly type: "text";
  text: string;
}
```

**Uso**: Respuestas conversacionales, explicaciones, mensajes sin estructura.

#### 2. ServicesAIPart

Lista de servicios médicos en formato carrusel.

```typescript
export interface ServiceData {
  id: string;
  name: string;
  description: string;
  price: string;          // e.g., "$500"
  duration: string;       // e.g., "45 min"
  category?: string;
}

export interface ServicesAIPart extends BaseAIPart {
  readonly type: "services-list";
  services: ServiceData[];
  title?: string;
}
```

**Uso**: Mostrar catálogo de servicios disponibles.

#### 3. AvailabilityAIPart

Slots de tiempo disponibles para agendar.

```typescript
export interface SlotData {
  id: string;
  startTime: string;      // ISO datetime
  endTime: string;        // ISO datetime
  available: number;      // Cantidad disponible
  maxReservations: number; // Capacidad máxima
}

export interface AvailabilityAIPart extends BaseAIPart {
  readonly type: "availability";
  date: string;           // YYYY-MM-DD
  slots: SlotData[];
  serviceId?: string;
}
```

**Uso**: Mostrar horarios disponibles para una fecha.

#### 4. ReservationAIPart

Confirmación de reserva.

```typescript
export interface ReservationData {
  id: string;
  status: "pending" | "confirmed" | "rejected";
  serviceName: string;
  date: string;
  time: string;
  patientName?: string;
  message?: string;
}

export interface ReservationAIPart extends BaseAIPart {
  readonly type: "reservation";
  reservation: ReservationData;
}
```

**Uso**: Confirmar que se ha creado una solicitud de cita.

#### 5. FAQAIPart

Lista de preguntas frecuentes.

```typescript
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAIPart extends BaseAIPart {
  readonly type: "faq";
  faqs: FAQItem[];
  category?: string;
}
```

**Uso**: Mostrar preguntas frecuentes relevantes.

#### 6. CalendarAIPart

Selector de fecha.

```typescript
export interface CalendarAIPart extends BaseAIPart {
  readonly type: "calendar";
  selectedDate?: string;
  minDate?: string;        // YYYY-MM-DD
  maxDate?: string;        // YYYY-MM-DD
  serviceId?: string;
}
```

**Uso**: Permitir al usuario seleccionar una fecha.

#### 7. PatientFormAIPart

Formulario para datos del paciente.

```typescript
export interface PatientFormData {
  name: string;
  phone: string;
  email?: string;
  chiefComplaint?: string;
  serviceId: string;
  slotId: string;
  serviceName?: string;
  date: string;
  time: string;
}

export interface PatientFormAIPart extends BaseAIPart {
  readonly type: "patient-form";
  title?: string;
  serviceId: string;
  slotId: string;
  serviceName?: string;
  date: string;
  time: string;
}
```

**Uso**: Recopilar datos del paciente antes de confirmar cita.

#### 8. ConfirmationAIPart

Diálogo de confirmación.

```typescript
export interface ConfirmationAIPart extends BaseAIPart {
  readonly type: "confirmation";
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  data?: unknown;
}
```

**Uso**: Solicitar confirmación del usuario para una acción.

### Union Type

```typescript
export type AIMessagePart =
  | TextAIPart
  | ServicesAIPart
  | AvailabilityAIPart
  | ReservationAIPart
  | FAQAIPart
  | CalendarAIPart
  | PatientFormAIPart
  | ConfirmationAIPart;
```

---

## Factory Pattern

### MessageRenderer

Componente principal que renderiza un array de partes.

```typescript
// packages/web/src/components/ai-ui/factory.tsx

interface MessageRendererProps {
  parts: AIMessagePart[];
  handlers?: AIUIHandlers;
}

export const MessageRenderer = memo(
  ({ parts, handlers }: MessageRendererProps) => {
    return (
      <div className="ai-message space-y-2">
        {parts.map((part, index) => (
          <PartRenderer
            key={part.id || index}
            part={part}
            handlers={handlers || {}}
          />
        ))}
      </div>
    );
  },
);
```

### PartRenderer

Dispatch component que renderiza cada tipo de parte.

```typescript
interface PartRendererProps {
  part: AIMessagePart;
  handlers: AIUIHandlers;
}

const PartRenderer = memo(({ part, handlers }: PartRendererProps) => {
  switch (part.type) {
    case "text":
      return <TextPart part={part} />;
    case "services-list":
      return <ServicesPart part={part} handlers={handlers} />;
    case "availability":
      return <AvailabilityPart part={part} handlers={handlers} />;
    case "reservation":
      return <ReservationPart part={part} handlers={handlers} />;
    case "faq":
      return <FAQPart part={part} handlers={handlers} />;
    case "calendar":
      return <CalendarPart part={part} handlers={handlers} />;
    case "patient-form":
      return <PatientFormPart part={part} handlers={handlers} />;
    case "confirmation":
      return <ConfirmationPart part={part} handlers={handlers} />;
    default:
      return null;
  }
});
```

### Type Guards

```typescript
// Type guards para verificar tipos
export function isTextPart(part: AIMessagePart): part is TextAIPart {
  return part.type === "text";
}

export function isServicesPart(part: AIMessagePart): part is ServicesAIPart {
  return part.type === "services-list";
}

// ... más type guards
```

---

## Handler Callbacks

### AIUIHandlers Interface

Callbacks para interacciones del usuario con componentes UI.

```typescript
export interface AIUIHandlers {
  // Service selection
  onSelectService?: (service: ServiceData) => void;

  // Time slot selection
  onSelectSlot?: (slot: SlotData, date: string, serviceId?: string) => void;

  // Reservation actions
  onConfirmReservation?: (reservation: ReservationData) => void;
  onCancelReservation?: (reservationId: string) => void;

  // Date selection
  onSelectDate?: (date: string, serviceId?: string) => void;

  // FAQ selection
  onSelectFAQ?: (item: FAQItem) => void;

  // Patient form submission
  onSubmitPatientData?: (data: PatientFormData) => void;

  // Confirmation dialog
  onConfirm?: (data?: unknown) => void;
  onCancel?: () => void;

  // Other actions
  onEscalate?: (reason?: string) => void;
  onRetry?: () => void;
}
```

### Implementación de Handlers

```typescript
// En el componente padre (ej: ChatWidget)

const handlers: AIUIHandlers = {
  onSelectService: async (service) => {
    // Enviar mensaje de selección al agente
    const message = `Quiero agendar una cita para: ${service.name}`;
    await sendMessage(message);
  },

  onSelectSlot: async (slot, date, serviceId) => {
    const message = `Seleccioné el horario ${slot.time} para el ${date}`;
    await sendMessage(message);
  },

  onSubmitPatientData: async (data) => {
    // Formatear datos y enviar
    const message = `Mis datos son:\nNombre: ${data.name}\nTel: ${data.phone}`;
    await sendMessage(message);
  },
};

// Usar en MessageRenderer
<MessageRenderer parts={parts} handlers={handlers} />
```

### Handler Type Mapping

Cada tipo de parte tiene handlers específicos requeridos:

```typescript
export type HandlerForPart<T extends AIMessagePart> =
  T extends ServicesAIPart
    ? Required<Pick<AIUIHandlers, "onSelectService">>
    : T extends AvailabilityAIPart
      ? Required<Pick<AIUIHandlers, "onSelectSlot">>
      : T extends ReservationAIPart
        ? Required<Pick<AIUIHandlers, "onConfirmReservation" | "onCancelReservation">>
        : // ... más mappings
          AIUIHandlers;
```

---

## Componentes Implementados

### TextPart

```typescript
export const TextPart = ({ part }: { part: TextAIPart }) => {
  return (
    <div className="ai-text text-sm leading-relaxed text-foreground">
      <MessageResponse message={part.text} />
    </div>
  );
};
```

**Características:**
- Renderizado markdown con `Streamdown`
- Estilos consistentes
- Soporta formato (negrita, cursiva, listas)

### ServicesPart

```typescript
export const ServicesPart = ({ part, handlers }: ServicesPartProps) => {
  return (
    <div className="ai-services my-4">
      {part.title && <h3 className="text-lg font-semibold">{part.title}</h3>}
      <Carousel className="w-[85%] md:w-[70%]">
        <CarouselContent>
          {part.services.map((service) => (
            <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3">
              <ServiceCard
                service={service}
                onSelect={() => handlers.onSelectService?.(service)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
```

**Características:**
- Carousel horizontal responsive
- ServiceCard con nombre, descripción, precio, duración
- Badge de categoría
- Botón "Agendar"

### AvailabilityPart

```typescript
export const AvailabilityPart = ({ part, handlers }: AvailabilityPartProps) => {
  return (
    <div className="ai-availability my-4">
      <h3 className="text-lg font-semibold mb-3">
        Horarios disponibles para {part.date}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {part.slots.map((slot) => (
          <SlotButton
            key={slot.id}
            slot={slot}
            available={slot.available > 0}
            onClick={() => handlers.onSelectSlot?.(slot, part.date, part.serviceId)}
          />
        ))}
      </div>
    </div>
  );
};
```

**Características:**
- Grid de 3 columnas
- Time slot buttons con disponibilidad
- Disabled state si no disponible
- Muestra hora y disponibilidad

### PatientFormPart

```typescript
export const PatientFormPart = ({ part, handlers }: PatientFormPartProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    chiefComplaint: "",
  });

  const handleSubmit = () => {
    handlers.onSubmitPatientData?.({
      ...formData,
      serviceId: part.serviceId,
      slotId: part.slotId,
      serviceName: part.serviceName,
      date: part.date,
      time: part.time,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Nombre completo"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      {/* ... más campos */}
      <Button type="submit">Confirmar Datos</Button>
    </form>
  );
};
```

**Características:**
- Validación de campos requeridos
- Placeholder text en español
- Email opcional
- Chief complaint opcional

---

## Chat Widget System

### Componentes del Chat

```
packages/web/src/components/chat/
├── index.tsx           # Main ChatWidget
├── chat-drawer.tsx     # Drawer (mobile) / Sheet (desktop)
└── chat-button.tsx     # Floating action button
```

### ChatWidget

Estado local del chat:

```typescript
const [messages, setMessages] = useState<BaseMessage[]>([]);
const [input, setInput] = useState("");
const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
const abortControllerRef = useRef<AbortController | null>(null);
```

Flujo de mensajes:

```typescript
const sendMessage = async (content: string) => {
  // 1. Crear mensaje de usuario
  const userMessage = createTextMessage(content);
  setMessages((prev) => [...prev, userMessage]);
  setStatus("submitted");

  // 2. Enviar al backend
  const response = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, profileId }),
  });

  // 3. Procesar respuesta
  const data = await response.json();
  const aiMessage = createAIMessage(data.text, data.parts);

  setMessages((prev) => [...prev, aiMessage]);
  setStatus("ready");
};
```

### Handlers del ChatWidget

```typescript
const handlers: AIUIHandlers = {
  onSelectService: async (service) => {
    const message = `Me interesa el servicio: ${service.name}`;
    await sendMessage(message);
  },

  onSelectSlot: async (slot, date, serviceId) => {
    const time = new Date(slot.startTime).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const message = `Quiero agendar para el ${date} a las ${time}`;
    await sendMessage(message);
  },

  onSubmitPatientData: async (data) => {
    const message = `Mis datos:\nNombre: ${data.name}\nTeléfono: ${data.phone}`;
    await sendMessage(message);
  },
};
```

### ChatDrawer (Responsive)

```typescript
export const ChatDrawer = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[85vh]">
          {/* Chat widget content */}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        {/* Chat widget content */}
      </SheetContent>
    </Sheet>
  );
};
```

**Responsive behavior:**
- Mobile: `<Drawer>` (bottom sheet)
- Desktop: `<Sheet>` (side panel)

---

## Cómo Agregar Nuevas Partes

### Paso 1: Definir Tipo en Backend

```typescript
// packages/api/src/services/ai/chat/schema.ts

export const myNewPartSchema = z.object({
  type: z.literal("my-new-type"),
  field1: z.string(),
  field2: z.number().optional(),
});

// Agregar al union
export const aiMessagePartSchema = z.union([
  // ... existing types
  myNewPartSchema,
]);
```

### Paso 2: Definir Tipo en Frontend

```typescript
// packages/web/src/components/ai-ui/types.ts

export interface MyNewAIPart extends BaseAIPart {
  readonly type: "my-new-type";
  field1: string;
  field2?: number;
}

// Agregar al union
export type AIMessagePart =
  | TextAIPart
  | ServicesAIPart
  // ... existing types
  | MyNewAIPart;
```

### Paso 3: Crear Componente

```typescript
// packages/web/src/components/ai-ui/my-new-part.tsx

import { memo } from "react";
import type { MyNewAIPart } from "./types";

interface MyNewPartProps {
  part: MyNewAIPart;
}

export const MyNewPart = memo(({ part }: MyNewPartProps) => {
  return (
    <div className="ai-my-new">
      <h4>{part.field1}</h4>
      {part.field2 && <span>{part.field2}</span>}
    </div>
  );
});

MyNewPart.displayName = "MyNewPart";
```

### Paso 4: Agregar Handler

```typescript
// En types.ts

export interface AIUIHandlers {
  // ... existing handlers
  onMyNewAction?: (data: { field1: string }) => void;
}
```

### Paso 5: Actualizar Factory

```typescript
// packages/web/src/components/ai-ui/factory.tsx

import { MyNewPart } from "./my-new-part";

const PartRenderer = memo(({ part, handlers }: PartRendererProps) => {
  switch (part.type) {
    // ... existing cases
    case "my-new-type":
      return <MyNewPart part={part} handlers={handlers} />;
    default:
      return null;
  }
});
```

### Paso 6: Actualizar Prompt del Agente

```typescript
// En config.ts

instructions: `
// ... existing instructions

**Para mi nuevo tipo de parte:**
\`\`\`json
{
  "parts": [
    {
      "type": "my-new-type",
      "field1": "valor",
      "field2": 123
    }
  ]
}
\`\`\`
`
```

---

## Referencias

- **VoltAgent Framework**: `docs/ai-voltagent-guide.md`
- **Agent Reference**: `docs/ai-agent-reference.md`
- **Tools Reference**: `docs/ai-tools-reference.md`
- **Patterns Guide**: `docs/ai-patterns.md`
- **Source Code**: `packages/web/src/components/ai-ui/`
