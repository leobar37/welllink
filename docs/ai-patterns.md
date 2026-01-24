# AI Patterns Guide

Guía paso a paso para extender el sistema de IA en Wellness-Link con nuevas herramientas y componentes UI.

## Índice

1. [Agregar una Nueva Herramienta](#agregar-una-nueva-herramienta)
2. [Agregar una Nueva Parte UI](#agregar-una-nueva-parte-ui)
3. [Integración Frontend-Backend](#integración-frontend-backend)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Troubleshooting](#troubleshooting)

---

## Agregar una Nueva Herramienta

### Escenario

Queremos agregar una herramienta para obtener información sobre la ubicación del consultorio médico.

### Paso 1: Crear el Archivo de la Tool

```bash
# En packages/api/src/services/ai/chat/tools/
touch location.ts
```

### Paso 2: Implementar la Tool

```typescript
// packages/api/src/services/ai/chat/tools/location.ts

import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { profile } from "../../../../db/schema/profile";
import { eq } from "drizzle-orm";

/**
 * Input schema para obtener ubicación
 */
const GetLocationInput = z.object({
  profileId: z.string().describe("The profile/doctor ID to get location for"),
});

/**
 * Tool para obtener información de ubicación del consultorio
 */
export const getLocationTool = createTool({
  name: "get_location",
  description:
    "Get the office location and contact information for a medical professional. Use this when a patient asks about address, location, maps, or how to get to the office.",
  parameters: GetLocationInput,

  execute: async ({ profileId }) => {
    try {
      // Obtener perfil con información de ubicación
      const [prof] = await db
        .select({
          id: profile.id,
          displayName: profile.displayName,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          postalCode: profile.postalCode,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
        })
        .from(profile)
        .where(eq(profile.id, profileId))
        .limit(1);

      if (!prof) {
        return {
          found: false,
          message: "No se encontró información de ubicación para este profesional",
        };
      }

      // Construir dirección completa
      const fullAddress = [
        prof.address,
        prof.city,
        prof.country,
        prof.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        success: true,
        location: {
          address: fullAddress,
          phone: prof.phone,
          email: prof.email,
          website: prof.website,
          mapUrl: prof.address
            ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
            : null,
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error obteniendo ubicación: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
```

### Paso 3: Exportar la Tool

```typescript
// packages/api/src/services/ai/chat/tools/index.ts

// ... existing exports

// Location tool
export { getLocationTool } from "./location";
```

### Paso 4: Registrar en el Agente

```typescript
// packages/api/src/services/ai/chat/agent.ts

import {
  // ... existing imports
  getLocationTool,  // ← Agregar import
} from "./tools";

export function createMedicalChatAgent(): Agent {
  // ...
  const agent = new Agent({
    ...chatAgentConfig,
    tools: [
      // ... existing tools
      getLocationTool,  // ← Agregar al array de tools
    ],
    memory,
  });
  return agent;
}
```

### Paso 5: Probar la Tool

```typescript
// Test manual o con un script
const agent = getMedicalChatAgent();

const result = await agent.generateText(
  "¿Dónde está ubicado tu consultorio?",
  {
    context: new Map([
      ["profileId", "test-profile-id"],
    ]),
  }
);

console.log(result.text);
// Debería usar la tool get_location
```

---

## Agregar una Nueva Parte UI

### Escenario

Queremos mostrar la información de ubicación con un componente visual que incluya un mapa y un botón para abrir en Google Maps.

### Paso 1: Definir Schema en Backend

```typescript
// packages/api/src/services/ai/chat/schema.ts

// Location part schema
export const locationPartSchema = z.object({
  type: z.literal("location"),
  address: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  mapUrl: z.string().optional(),
});

// Agregar al union
export const aiMessagePartSchema = z.union([
  textPartSchema,
  servicesPartSchema,
  availabilityPartSchema,
  reservationPartSchema,
  faqPartSchema,
  calendarPartSchema,
  patientFormPartSchema,
  confirmationPartSchema,
  locationPartSchema,  // ← Agregar
]);

// Exportar tipo
export type LocationPart = z.infer<typeof locationPartSchema>;
```

### Paso 2: Definir Tipo en Frontend

```typescript
// packages/web/src/components/ai-ui/types.ts

/**
 * Location data structure
 */
export interface LocationData {
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
}

/**
 * Location part - displays office location with map
 */
export interface LocationAIPart extends BaseAIPart {
  readonly type: "location";
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
}

// Agregar al union
export type AIMessagePart =
  | TextAIPart
  | ServicesAIPart
  | AvailabilityAIPart
  | ReservationAIPart
  | FAQAIPart
  | CalendarAIPart
  | PatientFormAIPart
  | ConfirmationAIPart
  | LocationAIPart;  // ← Agregar

// Type guard
export function isLocationPart(part: AIMessagePart): part is LocationAIPart {
  return part.type === "location";
}
```

### Paso 3: Crear Componente UI

```typescript
// packages/web/src/components/ai-ui/location-part.tsx

import { memo } from "react";
import { MapPin, Phone, Mail, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LocationAIPart } from "./types";

interface LocationPartProps {
  part: LocationAIPart;
}

export const LocationPart = memo(({ part }: LocationPartProps) => {
  return (
    <Card className="ai-location my-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Ubicación del Consultorio</h3>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Dirección:</p>
            <p className="text-base font-medium">{part.address}</p>
            {part.city && (
              <p className="text-sm text-muted-foreground">
                {part.city}
                {part.country && `, ${part.country}`}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {part.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{part.phone}</span>
              </div>
            )}
            {part.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{part.email}</span>
              </div>
            )}
          </div>

          {/* Map Button */}
          {part.mapUrl && (
            <Button asChild variant="outline" className="w-full">
              <a
                href={part.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Abrir en Google Maps
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

LocationPart.displayName = "LocationPart";
```

### Paso 4: Actualizar Factory

```typescript
// packages/web/src/components/ai-ui/factory.tsx

import { LocationPart } from "./location-part";  // ← Agregar import

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
    case "location":  // ← Agregar case
      return <LocationPart part={part} />;
    default:
      return null;
  }
});
```

### Paso 5: Actualizar Prompt del Agente

```typescript
// packages/api/src/services/ai/chat/config.ts

export function getChatInstructions(profileInfo: { ... }): string {
  return `Eres un assistente virtual amable y profesional de ${profileInfo.displayName}.

// ... existing instructions

**Para mostrar información de ubicación:**
\`\`\`json
{
  "parts": [
    {
      "type": "text",
      "text": "Aquí tienes la información de nuestra ubicación:"
    },
    {
      "type": "location",
      "address": "Av. Principal 123, Oficina 456",
      "city": "Lima",
      "country": "Perú",
      "phone": "+51 987 654 321",
      "email": "contacto@doctor.com",
      "mapUrl": "https://maps.google.com/?q=Av.+Principal+123+Lima"
    }
  ]
}
\`\`\`

// ... rest of instructions
`;
}
```

---

## Integración Frontend-Backend

### Flujo Completo de una Nueva Feature

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BACKEND - Tool Creation                                   │
│    - Create tool con createTool()                           │
│    - Define Zod schema                                      │
│    - Execute: Query DB, return structured data              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND - Agent Configuration                             │
│    - Export tool in tools/index.ts                          │
│    - Register in agent.ts tools array                       │
│    - Add JSON format to instructions                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND - Schema Definition                               │
│    - Add Zod schema to schema.ts                            │
│    - Add to aiMessagePartSchema union                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. FRONTEND - Type Definition                                 │
│    - Add interface to types.ts                              │
│    - Add to AIMessagePart union                             │
│    - Add type guard                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. FRONTEND - Component Creation                              │
│    - Create component file (my-part.tsx)                    │
│    - Implement with shadcn/ui components                   │
│    - Add responsive styles                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FRONTEND - Factory Update                                  │
│    - Import component in factory.tsx                        │
│    - Add case to PartRenderer switch                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. TESTING                                                    │
│    - Test tool execution in backend                         │
│    - Test JSON parsing                                      │
│    - Test UI rendering in frontend                         │
│    - Test end-to-end flow                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Ejemplos Prácticos

### Ejemplo 1: Tool con Query Complejo

Herramienta que obtiene estadísticas de un paciente.

```typescript
// packages/api/src/services/ai/chat/tools/patient-stats.ts

import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { client, reservationRequest } from "../../../../db/schema";
import { eq, and, count, gte } from "drizzle-orm";

const GetPatientStatsInput = z.object({
  profileId: z.string().describe("The profile/doctor ID"),
  patientId: z.string().describe("The patient ID"),
});

export const getPatientStatsTool = createTool({
  name: "get_patient_stats",
  description: "Get statistics for a patient including total appointments, completed appointments, and total spent. Use this when a patient asks about their history or statistics.",
  parameters: GetPatientStatsInput,

  execute: async ({ profileId, patientId }) => {
    try {
      // Get patient info
      const [patient] = await db
        .select()
        .from(client)
        .where(and(eq(client.id, patientId), eq(client.profileId, profileId)))
        .limit(1);

      if (!patient) {
        return { found: false, message: "Patient not found" };
      }

      // Get appointment stats
      const [stats] = await db
        .select({
          total: count(),
          completed: count(
            reservationRequest.id
          ),
        })
        .from(reservationRequest)
        .where(
          and(
            eq(reservationRequest.patientId, patientId),
            eq(reservationRequest.profileId, profileId)
          )
        );

      // Get recent appointments
      const recent = await db
        .select()
        .from(reservationRequest)
        .where(
          and(
            eq(reservationRequest.patientId, patientId),
            eq(reservationRequest.profileId, profileId),
            gte(reservationRequest.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 90 days
          )
        )
        .orderBy(reservationRequest.createdAt)
        .limit(5);

      return {
        success: true,
        stats: {
          patientName: patient.name,
          label: patient.label,
          totalAppointments: stats.total,
          completedAppointments: stats.completed,
          recentAppointments: recent.map(r => ({
            date: r.createdAt.toISOString().split('T')[0],
            status: r.status,
          })),
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  },
});
```

### Ejemplo 2: Parte UI con Acciones

Componente que muestra estadísticas del paciente con opción de descargar historial.

```typescript
// packages/web/src/components/ai-ui/patient-stats-part.tsx

import { memo } from "react";
import { Download, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientStatsData {
  patientName: string;
  label: string;
  totalAppointments: number;
  completedAppointments: number;
  recentAppointments: Array<{
    date: string;
    status: string;
  }>;
}

interface PatientStatsPartProps {
  part: {
    type: "patient-stats";
    stats: PatientStatsData;
  };
  handlers?: {
    onDownloadHistory?: () => void;
  };
}

export const PatientStatsPart = memo(({ part, handlers }: PatientStatsPartProps) => {
  const { stats } = part;

  return (
    <Card className="ai-patient-stats my-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Estadísticas de {stats.patientName}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handlers?.onDownloadHistory}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Historial
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Citas</p>
              <p className="text-2xl font-bold">{stats.totalAppointments}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-2xl font-bold">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        {stats.recentAppointments.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Citas Recientes</p>
            <div className="space-y-1">
              {stats.recentAppointments.map((apt, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1 px-2 bg-muted/50 rounded"
                >
                  <span>{apt.date}</span>
                  <span className={`capitalize ${
                    apt.status === "confirmed" ? "text-green-600" :
                    apt.status === "pending" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PatientStatsPart.displayName = "PatientStatsPart";
```

### Ejemplo 3: Handler con Callback Asíncrono

```typescript
// En el componente padre (ChatWidget)

const handlers: AIUIHandlers = {
  onDownloadHistory: async () => {
    // Mostrar loading
    toast({
      title: "Generando historial...",
      description: "Esto puede tomar unos segundos",
    });

    try {
      // Llamar API para generar PDF
      const response = await fetch(`/api/patient/${patientId}/history/pdf`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Error generating PDF");

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial-${patientName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Historial descargado",
        description: "El archivo se ha descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el historial",
        variant: "destructive",
      });
    }
  },
};
```

---

## Troubleshooting

### Issue: Tool No Se Ejecuta

**Síntomas:** El LLM no llama a la herramienta.

**Soluciones:**
1. **Verificar descripción de la tool:**
   ```typescript
   // ❌ Mal
   description: "Get patient stats"

   // ✅ Bien
   description: "Get statistics for a patient including total appointments, completed appointments, and total spent. Use this when a patient asks about their history, statistics, or past appointments."
   ```

2. **Verificar que la tool esté registrada:**
   ```typescript
   // En agent.ts
   tools: [
     getPatientTool,
     getPatientStatsTool,  // ← Debe estar aquí
     // ...
   ]
   ```

3. **Verificar el schema de parámetros:**
   ```typescript
   // Usa .describe() para cada parámetro
   parameters: z.object({
     patientId: z.string().describe("The patient ID to get stats for"),
     profileId: z.string().describe("The profile/doctor ID"),
   })
   ```

### Issue: Parte UI No Se Renderiza

**Síntomas:** El JSON se muestra como texto plano.

**Soluciones:**
1. **Verificar formato del JSON en respuesta:**
   ```json
   // ❌ Mal - Falta "parts" wrapper
   { "type": "location", "address": "..." }

   // ✅ Bien
   { "parts": [{ "type": "location", "address": "..." }] }
   ```

2. **Verificar case en factory:**
   ```typescript
   // El type debe coincidir exactamente
   case "location":  // ← Debe ser igual que en schema/types
     return <LocationPart part={part} />;
   ```

3. **Verificar import del componente:**
   ```typescript
   // En factory.tsx
   import { LocationPart } from "./location-part";  // ← Debe importarse
   ```

### Issue: Schema Validation Error

**Síntomas:** Error en console.log sobre schema validation.

**Soluciones:**
1. **Verificar que el schema coincida frontend-backend:**
   ```typescript
   // Backend (schema.ts)
   export const locationPartSchema = z.object({
     type: z.literal("location"),
     address: z.string(),
     city: z.string().optional(),  // ← Opcional
   });

   // Frontend (types.ts)
   export interface LocationAIPart extends BaseAIPart {
     readonly type: "location";
     address: string;
     city?: string;  // ← Debe ser opcional también
   }
   ```

2. **Verificar el union schema:**
   ```typescript
   // Asegúrate de agregar el nuevo schema al union
   export const aiMessagePartSchema = z.union([
     textPartSchema,
     locationPartSchema,  // ← Debe estar aquí
     // ...
   ]);
   ```

### Issue: Handler No Se Llama

**Síntomas:** El botón no hace nada.

**Soluciones:**
1. **Verificar que el handler se esté pasando:**
   ```typescript
   // En MessageRenderer
   <MessageRenderer parts={parts} handlers={handlers} />
   //                                    ^^^^^^^ Debe pasarse
   ```

2. **Verificar que el componente use el handler:**
   ```typescript
   // En el componente
   export const LocationPart = ({ part, handlers }: LocationPartProps) => {
     return (
       <Button onClick={() => handlers?.onSomeAction?.(data)}>
         Click me
       </Button>
     );
   };
   ```

---

## Referencias

- **VoltAgent Framework**: `docs/ai-voltagent-guide.md`
- **Tools Reference**: `docs/ai-tools-reference.md`
- **Agent Reference**: `docs/ai-agent-reference.md`
- **UI Reference**: `docs/ai-ui-reference.md`
- **Backend Tools**: `packages/api/src/services/ai/chat/tools/`
- **Frontend Components**: `packages/web/src/components/ai-ui/`
