# Health Survey to Client Integration

## Overview
This document shows how to integrate health survey responses with the client management system, supporting both automatic and manual client creation. This enables advisors to capture leads from surveys and convert them into clients for messaging campaigns.

## Two Creation Methods

### Method 1: From Health Survey
```
Health Survey Submitted → Create Client → Add to Client List
```
- **Trigger**: Survey completion
- **Source**: Survey data (visitorName, visitorPhone, email)
- **Default Label**: Prospecto
- **Use Case**: New leads from website
- **Note**: `visitorPhone` is used for both phone and WhatsApp communication

### Method 2: Manual Client Creation
```
Advisor Input → Create Client → Add to Client List
```
- **Trigger**: Manual form submission
- **Source**: Advisor-entered data
- **Default Label**: Consumidor (or chosen)
- **Use Case**: Existing contacts, referrals, walk-ins
- **Note**: `phone` field serves for both phone and WhatsApp communication


## Current Health Survey Data

From `packages/api/src/db/schema/health-survey.ts`, we have:
- `visitorName` (required)
- `visitorPhone` (optional) - used for both phone and WhatsApp
- `visitorEmail` (optional)
- `referredBy` (optional)

**Note**: The `visitorPhone` field serves for both phone and WhatsApp communication, following the unified approach.

## Implementation Options

### Option A: Auto-Create from Survey (Recommended for Lead Capture)

When a health survey is submitted with phone/whatsapp, automatically create a client.

**Best For**: High-volume lead capture where every survey should become a client

```typescript
// packages/api/src/services/business/health-survey.ts
async createSurveyResponse(data: CreateSurveyData) {
  const survey = await this.healthSurveyRepository.create({...});

  // Auto-create if contact info provided
  if (data.visitorPhone || data.visitorWhatsapp) {
    try {
      await this.clientService.createClient(data.profileId, {
        healthSurveyId: survey.id,
        name: data.visitorName,
        phone: data.visitorPhone,
        whatsapp: data.visitorWhatsapp,
        email: data.visitorEmail,
        label: ClientLabel.PROSPECTO,
      });
    } catch (error) {
      // Don't fail survey if client creation fails
      console.error("Failed to create client from survey:", error);
    }
  }

  return survey;
}
```

**Pros**:
- ✅ Zero friction - happens automatically
- ✅ All leads captured
- ✅ Immediate follow-up possible
- ✅ Consistent process
- ✅ Single field for contact simplifies logic

**Cons**:
- ❌ Less control over which surveys become clients
- ❌ May create clients without phone (if auto-creating)
- ❌ Harder to review before creation

---

### Option B: Manual "Create Client" Button (Recommended for Quality Control)

Add a "Create Client" button in the health survey list view.

**Best For**: Advisors who want to review before converting surveys to clients

```typescript
// packages/web/src/components/HealthSurveyList.tsx
{survey.visitorPhone && (
  <Button
    size="sm"
    onClick={() => createClientFromSurvey(survey.id)}
  >
    Crear Cliente
  </Button>
)}
```

```typescript
// Backend route
.post("/:id/create-client", async ({ healthSurveyService, ctx, params, set }) => {
  const client = await healthSurveyService.createClientFromSurvey(
    params.id,
    ctx!.userId
  );
  set.status = 201;
  return client;
});
```

**Pros**:
- ✅ Full control - advisor chooses which surveys become clients
- ✅ Can review data before creation
- ✅ Quality over quantity
- ✅ Can add extra notes during creation

**Cons**:
- ❌ Requires manual action
- ❌ May miss converting some surveys
- ❌ Takes more time

---

### Option C: Both Approaches (Best of Both Worlds)

Enable **both** auto-creation AND manual button:

**Configuration Setting**:
```typescript
// In profile settings
interface ProfileSettings {
  autoCreateClientsFromSurveys: boolean; // true/false
}
```

**Conditional Logic**:
```typescript
async createSurveyResponse(data: CreateSurveyData) {
  const survey = await this.healthSurveyRepository.create({...});

  const settings = await this.getProfileSettings(data.profileId);

  // Auto-create if enabled in settings
  if (settings.autoCreateClientsFromSurveys && data.visitorPhone) {
    await this.clientService.createClient(data.profileId, {
      healthSurveyId: survey.id,
      name: data.visitorName,
      phone: data.visitorPhone, // Used for both phone and WhatsApp
      email: data.visitorEmail,
      label: ClientLabel.PROSPECTO,
    });
  }

  return survey;
}
```

**UI**:
- If auto-create is ON: Shows "Cliente creado automáticamente" badge
- If auto-create is OFF: Shows "Crear Cliente" button

**This is the recommended approach** because:
- ✅ Flexibility for different advisor preferences
- ✅ Can start with manual mode, enable auto-mode later
- ✅ Each advisor can choose their workflow
- ✅ Settings can be changed anytime
- ✅ Single contact field simplifies the logic

---

## When to Use Each Method

### Use Auto-Creation (Option A) When:
- Getting many surveys daily (20+ per day)
- Most surveys have complete contact info
- Want to ensure no leads are missed
- Have high follow-up capacity
- Processing speed is critical

### Use Manual Creation (Option B) When:
- Getting few surveys daily (< 10 per day)
- Want to review each lead personally
- Adding value-added services during conversion
- Quality over quantity is important
- Have time for manual review

### Use Both (Option C) When:
- Want maximum flexibility
- Team has mixed preferences
- Starting to scale up lead volume
- Need to test both workflows
- Different campaigns may need different approaches

## Handling Duplicates

When a survey with an existing phone is submitted:

```typescript
// In HealthSurveyService.createSurveyResponse
if (data.visitorPhone) {
  try {
    await this.clientService.createClient(data.profileId, {
      // ... client data ...
      phone: data.visitorPhone, // Used for both phone and WhatsApp
    });
  } catch (error) {
    if (error instanceof BadRequestException && error.message.includes("already exists")) {
      // Survey submitted but client already exists - this is OK
      // Could log for analytics
      console.log("Survey from existing client:", data.visitorPhone);
    } else {
      throw error;
    }
  }
}
```

**Note**: Since we use a single `phone` field for both phone and WhatsApp communication, duplicate checking is simpler and more reliable.

After creating the schema files, run:

```bash
cd packages/api
bun run db:generate
bun run db:migrate
```

## Testing Both Methods

### Test Manual Client Creation

```typescript
// packages/api/src/services/business/__tests__/client.test.ts
describe("ClientService", () => {
  it("should create client manually", async () => {
    const clientData = {
      name: "Carlos Pérez",
      phone: "+1234567890", // Used for both phone and WhatsApp
      label: ClientLabel.CONSUMIDOR,
    };

    const client = await clientService.createClient(profileId, clientData);

    expect(client).toBeDefined();
    expect(client.name).toBe("Carlos Pérez");
    expect(client.label).toBe(ClientLabel.CONSUMIDOR);
    expect(client.phone).toBe("+1234567890"); // Phone field used for both
  });

  it("should require phone/WhatsApp number", async () => {
    const clientData = {
      name: "Juan Pérez",
      // No phone/WhatsApp
    };

    await expect(
      clientService.createClient(profileId, clientData)
    ).rejects.toThrow("Phone/WhatsApp number is required");
  });

  it("should reject duplicate phone/WhatsApp", async () => {
    const clientData = {
      name: "Duplicate User",
      phone: "+1234567890",
    };

    // Create first client
    await clientService.createClient(profileId, clientData);

    // Try to create second client with same phone
    await expect(
      clientService.createClient(profileId, clientData)
    ).rejects.toThrow("Client with this phone/WhatsApp already exists");
  });
});
```

### Test Survey-Based Client Creation

```typescript
// packages/api/src/services/business/__tests__/health-survey.test.ts
describe("HealthSurveyService", () => {
  it("should create client from survey", async () => {
    const survey = await healthSurveyService.createSurveyResponse({
      profileId,
      visitorName: "Ana García",
      visitorPhone: "+0987654321", // Used for both phone and WhatsApp
      responses: {},
    });

    const client = await healthSurveyService.createClientFromSurvey(
      survey.id,
      profileId
    );

    expect(client).toBeDefined();
    expect(client.name).toBe("Ana García");
    expect(client.healthSurveyId).toBe(survey.id);
    expect(client.label).toBe(ClientLabel.PROSPECTO);
    expect(client.phone).toBe("+0987654321"); // Phone field used for both
  });

  it("should not create client when survey has no phone", async () => {
    const surveyData = {
      profileId: "profile-123",
      visitorName: "Jane Doe",
      responses: {},
      // No visitorPhone
    };

    await service.createSurveyResponse(surveyData);

    const clients = await clientService.getClients(surveyData.profileId);
    expect(clients).toHaveLength(0);
  });

  it("should handle duplicate phone from survey gracefully", async () => {
    const surveyData = {
      profileId: "profile-123",
      visitorName: "Existing Client",
      visitorPhone: "+1234567890", // Same phone as existing client
      responses: {},
    };

    // First survey creates client
    const survey1 = await service.createSurveyResponse(surveyData);
    await healthSurveyService.createClientFromSurvey(survey1.id, profileId);

    // Second survey with same phone
    const survey2 = await service.createSurveyResponse({
      ...surveyData,
      visitorName: "Same Person Different Survey",
    });

    // Should throw error about duplicate
    await expect(
      healthSurveyService.createClientFromSurvey(survey2.id, profileId)
    ).rejects.toThrow("Client already exists from this survey");
  });
});
```

## Frontend Integration

### Client List View (Manual Creation)

```tsx
// packages/web/src/pages/dashboard/ClientsList.tsx
export function ClientsList() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Clientes</h2>
        <Button onClick={() => openCreateClientModal()}>
          + Nuevo Cliente
        </Button>
      </div>

      {clients?.map((client) => (
        <div key={client.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{client.name}</h3>
              <p className="text-sm text-muted-foreground">
                {client.phone || client.whatsapp}
              </p>
              <Badge variant="outline">{client.label}</Badge>
            </div>
            <Button size="sm" variant="outline">
              Editar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Create Client Modal

```tsx
// packages/web/src/components/CreateClientModal.tsx
export function CreateClientModal() {
  const createClient = useCreateClient();

  const onSubmit = (data: CreateClientForm) => {
    createClient.mutate({
      name: data.name,
      phone: data.phone, // Required - used for both phone and WhatsApp
      email: data.email || undefined,
      label: data.label,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        placeholder="Nombre completo *"
        {...register("name", { required: true })}
      />

      <Input
        placeholder="Teléfono/WhatsApp *"
        {...register("phone", { required: true })}
      />
      <p className="text-xs text-muted-foreground">
        Este número se usará para llamadas y mensajes de WhatsApp
      </p>

      <Input
        placeholder="Email"
        type="email"
        {...register("email")}
      />

      <Select {...register("label")}>
        <option value="consumidor">Consumidor</option>
        <option value="prospecto">Prospecto</option>
        <option value="afiliado">Afiliado</option>
      </Select>

      <Button type="submit" disabled={createClient.isPending}>
        {createClient.isPending ? "Creando..." : "Crear Cliente"}
      </Button>
    </form>
  );
}
```

**Note**: The phone field is required and serves for both phone calls and WhatsApp messages, following the unified approach from the backend architecture.

### Health Survey List View (Survey-Based Creation)

```tsx
// packages/web/src/pages/dashboard/HealthSurveyList.tsx
export function HealthSurveyList() {
  const { data: surveys, isLoading } = useHealthSurveys();
  const { createClientFromSurvey } = useCreateClientFromSurvey();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-4">
      {surveys?.map((survey) => (
        <div key={survey.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{survey.visitorName}</h3>
              <p className="text-sm text-muted-foreground">
                {survey.visitorPhone || "Sin teléfono/WhatsApp"}
              </p>
              <Badge variant={survey.clientId ? "default" : "secondary"}>
                {survey.clientId ? "Cliente creado" : "Prospecto"}
              </Badge>
            </div>
            {!survey.clientId && survey.visitorPhone && (
              <Button
                size="sm"
                onClick={() => createClientFromSurvey(survey.id)}
              >
                Crear Cliente
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Note**: We only check for `visitorPhone` since this field serves for both phone and WhatsApp communication, following the unified approach from backend.md.

## Benefits of Both Methods

### Survey-Based Creation Benefits
1. **Lead Capture**: Converts website visitors to clients automatically
2. **Data Reuse**: No need to re-enter contact information
3. **Audit Trail**: Track which surveys became clients
4. **Faster Follow-up**: Clients appear immediately in messaging system

### Manual Creation Benefits
1. **Flexibility**: Add clients from any source (referrals, walk-ins, etc.)
2. **Complete Control**: Advisor decides which contacts to add
3. **Immediate Entry**: Can add clients without waiting for surveys
4. **Label Choice**: Can set appropriate label at creation time

## Next Steps

1. ✅ Create `client.ts` schema file
2. ✅ Create `client-note.ts` schema file
3. ✅ Create `ClientRepository`
4. ✅ Create `ClientService`
5. ✅ Create `ClientNoteRepository`
6. ✅ Add client routes
7. ✅ Add survey-to-client routes
8. ✅ Register in servicesPlugin
9. ✅ Update health-survey service
10. ✅ Create migration
11. ✅ Update frontend (both client list and survey list)

**Note**: All files follow the naming conventions established in `backend.md` where table names are singular (e.g., `client-note` not `client-comment`).

## Migration Strategy

To avoid breaking existing functionality:

1. **Phase 1**: Create schema, services, routes
2. **Phase 2**: Add manual "Create Client" to dashboard
3. **Phase 3**: Add "Create Client" button to survey list
4. **Phase 4**: Enable optional auto-creation (configurable)
5. **Phase 5**: Add bulk import features

This approach allows gradual rollout and user testing at each phase.
