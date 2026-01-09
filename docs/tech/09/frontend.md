# Frontend Implementation - Client Management & Health Surveys

## Architecture Decisions

### Pattern Recognition
The existing codebase follows a consistent pattern for data management and UI composition:

**API Integration Pattern:**
- `edenTreaty<App>` with shared types from API package
- Automatic credential injection via `credentials: "include"`
- All API calls use the pattern: `const { data, error } = await api.api.endpoint.method()`

**State Management Pattern:**
- TanStack Query for server state
- Custom hooks wrap query logic
- React Hook Form + Zod for form validation
- useProfile hook for current user context

**Component Architecture:**
- Page components in `routes/dashboard.*.tsx`
- Reusable components in `components/ui/` (shadcn) or `components/{feature}/`
- Consistent loading states with `Loader2` or `Skeleton`
- Empty states for no-data scenarios

### TanStack Query Best Practices

**Separate Hooks for Query vs Mutation:**
- **Query hooks** (`useXxx`): Only data fetching, loading, error states
- **Mutation hooks** (`useXxxAction`): Only mutations, no queries
- **Benefits**:
  - Reusability: Use query without unwanted mutations
  - Composition: Combine hooks freely
  - Granular cache: Invalidate only what's needed
  - Clear separation of concerns

## Implementation Strategy

### Phase 1: Data Layer (Hooks)

#### useClients Hook (Properly Encapsulated)
```typescript
// packages/web/src/hooks/use-clients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";

export interface Client {
  id: string;
  profileId: string;
  name: string;
  phone: string;
  email?: string;
  label: "consumidor" | "prospecto" | "afiliado";
  notes?: string;
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useClients() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api.clients.get();
      if (error) throw error;
      return (data as Client[]).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!profile?.id,
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, "id" | "createdAt" | "updatedAt" | "profileId">) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } = await api.api.clients.post({
        ...client,
        profileId: profile.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear cliente");
      toast.error(errorMessage);
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { data: resData, error } = await api.api.clients[id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar cliente");
      toast.error(errorMessage);
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.clients[id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar cliente");
      toast.error(errorMessage);
    },
  });

  const getClientsByLabel = (label: Client["label"]) => {
    return useQuery({
      queryKey: ["clients", profile?.id, "label", label],
      queryFn: async () => {
        const { data, error } = await api.api.clients.label[label].get();
        if (error) throw error;
        return data as Client[];
      },
      enabled: !!profile?.id && !!label,
    });
  };

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientsByLabel,
  };
}
```

#### useHealthSurveys Hook (Query Only)
```typescript
// packages/web/src/hooks/use-health-surveys.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProfile } from "./use-profile";

export interface HealthSurvey {
  id: string;
  profileId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorWhatsapp?: string;
  referredBy?: string;
  responses: Record<string, unknown>;
  whatsappSentAt?: Date;
  createdAt: Date;
}

export function useHealthSurveys() {
  const { profile } = useProfile();

  const {
    data: surveys,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["health-surveys", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api["health-survey"].get({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return (data as HealthSurvey[]).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!profile?.id,
  });

  return {
    surveys,
    isLoading,
    error,
  };
}
```

#### useSurveyToClient Hook (Mutation Only)
```typescript
// packages/web/src/hooks/use-survey-to-client.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";

export function useSurveyToClient() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const convertToClient = useMutation({
    mutationFn: async (surveyId: string) => {
      if (!profile?.id) throw new Error("No profile");
      const { data, error } = await api.api["health-survey"][surveyId]["create-client"].post({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado desde encuesta");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al convertir encuesta");
      toast.error(errorMessage);
    },
  });

  const bulkConvertToClients = useMutation({
    mutationFn: async (surveyIds: string[]) => {
      if (!profile?.id) throw new Error("No profile");
      const { data, error } = await api.api["health-survey"]["bulk-create-clients"].post({
        surveyIds,
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Clientes creados desde encuestas");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error en conversión masiva");
      toast.error(errorMessage);
    },
  });

  return {
    convertToClient,
    bulkConvertToClients,
  };
}
```

### Phase 2: UI Components

#### ClientList Component
Location: `packages/web/src/components/clients/ClientList.tsx`

Features:
- Filter by label (consumidor, prospecto, afiliado)
- Search by name/phone/email
- Client cards with key info
- Actions: Edit, Delete, View Notes
- Empty state when no clients

#### ClientForm Component (Responsive Sheet)
Location: `packages/web/src/components/clients/ClientForm.tsx`

Uses `ResponsiveDialog` for mobile/desktop adaptation (Drawer on mobile, Dialog on desktop).

Features:
- **Responsive Dialog**: Dialog in desktop, Drawer in mobile (via ResponsiveDialog)
- **React Hook Form + Zod**: Full validation
- **Form Fields**:
  - name (required, min 2 chars)
  - phone (required, min 8 chars)
  - email (optional, email validation)
  - label (required: consumidor/prospecto/afiliado)
  - notes (optional, textarea)
- **State Management**: Controlled open state, form reset on close
- **Submit Handling**: Loading state, success feedback, optimistic updates

```typescript
// packages/web/src/components/clients/ClientForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { clientFormSchema, type ClientForm } from "./client-form-schema";
import type { Client } from "@/hooks/use-clients";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client; // If provided, it's an edit form
  onSave: (data: ClientForm) => Promise<void>;
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientForm>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
      email: client?.email || "",
      label: client?.label || "prospecto",
      notes: client?.notes || "",
    },
  });

  const onSubmit = async (data: ClientForm) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={client ? "Editar Cliente" : "Nuevo Cliente"}
      description="Completa la información del cliente"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            placeholder="Nombre del cliente"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            placeholder="+1234567890"
            {...register("phone")}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="cliente@email.com"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Etiqueta *</Label>
          <select
            id="label"
            {...register("label")}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="prospecto">Prospecto</option>
            <option value="consumidor">Consumidor</option>
            <option value="afiliado">Afiliado</option>
          </select>
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            placeholder="Notas adicionales..."
            {...register("notes")}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
```

#### HealthSurveysList Component
Location: `packages/web/src/components/surveys/HealthSurveysList.tsx`

Uses separate hooks for query and mutation:

```typescript
export function HealthSurveysList() {
  const { surveys, isLoading } = useHealthSurveys();
  const { convertToClient, bulkConvertToClients } = useSurveyToClient();

  return (
    <div className="space-y-4">
      {surveys?.map((survey) => (
        <SurveyCard
          key={survey.id}
          survey={survey}
          onConvert={() => convertToClient.mutate(survey.id)}
        />
      ))}
    </div>
  );
}
```

### Phase 3: Page Routes

#### Dashboard Clients Route
Location: `packages/web/src/routes/dashboard.clients.tsx`

Structure:
```typescript
export default function ClientsRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <ClientFilters />
      <ClientList />
    </div>
  );
}
```

#### Dashboard Surveys Route (Enhance Existing)
Location: `packages/web/src/routes/dashboard.surveys._index.tsx`

Enhancements:
- Add conversion UI
- Bulk actions toolbar
- Stats widget (total, recent, conversion rate)

### Phase 4: Navigation & Dashboard Integration

#### Sidebar Navigation
Update: `packages/web/src/components/app-sidebar.tsx`

Add items:
```typescript
{
  title: "Clientes",
  url: "/dashboard/clients",
  icon: Users, // new icon
}
```

#### Dashboard Overview Stats
Update: `packages/web/src/pages/dashboard/DashboardOverview.tsx`

Add client stats card:
```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
    <p className="text-xs text-muted-foreground">
      +{stats?.newClientsThisMonth || 0} este mes
    </p>
  </CardContent>
</Card>
```

## Key Integration Points

### API Endpoints Mapping
- `GET /clients` → useClients().clients
- `POST /clients` → useClients().createClient
- `GET /clients/label/:label` → Filtered query or server-side filtering
- `GET /health-survey?profileId=` → useHealthSurveys().surveys
- `POST /health-survey/:id/create-client` → useSurveyToClient().convertToClient
- `POST /health-survey/bulk-create-clients` → useSurveyToClient().bulkConvertToClients

### Client-Server Data Flow
1. Client submits form → mutationFn → API POST → invalidate queries → UI updates
2. Survey conversion → mutationFn → API POST → invalidate both queries → Cross-feature sync
3. Bulk operations → Batch API calls → Progress indicators → Success/failure feedback

### Error Handling
- API errors caught via react-query
- Display toasts: `toast.error(error.message || "Error al guardar")`
- Form validation via Zod schemas
- Network errors: retry mechanisms

## File Structure Summary

```
packages/web/src/
├── hooks/
│   ├── use-clients.ts              # Client CRUD operations
│   ├── use-health-surveys.ts       # Survey queries only
│   └── use-survey-to-client.ts     # Survey-to-client conversion mutations
├── components/
│   ├── clients/
│   │   ├── ClientList.tsx          # List with filters
│   │   ├── ClientCard.tsx          # Individual client display
│   │   ├── ClientForm.tsx          # Create/edit form
│   │   └── ClientNotes.tsx         # Notes management
│   └── surveys/
│       ├── HealthSurveysList.tsx   # Survey list
│       ├── SurveyCard.tsx          # Individual survey
│       └── SurveyToClient.tsx      # Conversion UI
└── routes/
    └── dashboard.clients.tsx       # Clients page
```

## Language & Theme Requirements

- **UI Text**: All Spanish (botones, labels, mensajes)
- **Theme**: CSS variables (`bg-background`, `text-foreground`)
- **Components**: shadcn/ui base + custom extensions
- **Loading**: `Skeleton` for cards, `Loader2` for inline actions
- **Empty States**: Descriptive text + action button

## Validation Rules

```typescript
// packages/web/src/components/clients/client-form-schema.ts
import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(8, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  label: z.enum(["consumidor", "prospecto"], {
    required_error: "Selecciona una etiqueta",
  }),
  notes: z.string().optional(),
});

export type ClientForm = z.infer<typeof clientFormSchema>;
```

**Survey Conversion Rules:**
- Survey must have visitorName
- Survey must have at least one contact method (phone/email/whatsapp)
- Auto-assign "prospecto" label to converted clients

## Performance Considerations

- Use `enabled` flags in queries based on `profile?.id`
- Implement pagination for large client lists (>100 items)
- Debounce search inputs (300ms)
- Use `select` in queries for data transformation
- Optimistic updates for instant UI feedback

## Testing Strategy

- Unit tests for hooks (mock API responses)
- Component tests with React Testing Library
- E2E tests for critical flows:
  - Create client → edit → delete
  - Survey → convert to client → verify in clients list
  - Bulk convert multiple surveys

## Success Metrics

- Client list loads in <200ms
- Form submission feedback in <500ms
- Zero type errors (TypeScript strict mode)
- All text in Spanish
- Responsive on all breakpoints
- Consistent with existing design patterns