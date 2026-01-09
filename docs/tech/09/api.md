# API Routes Documentation - Mass Messaging with AI + WhatsApp

## Overview

This document describes the API routes implemented for the Mass Messaging with AI + WhatsApp feature. These routes enable client management, campaign templates, and health survey integration.

## Base URL

```
/api/v1
```

## Authentication

All routes (except health survey public submission) require authentication via Better Auth session cookies.

---

## Client Management Routes

### Base Path: `/clients`

#### List all clients

```http
GET /clients
```

**Response:**
```json
[
  {
    "id": "uuid",
    "profileId": "uuid",
    "name": "string",
    "phone": "string",
    "email": "string?",
    "label": "consumidor" | "prospecto" | "afiliado",
    "notes": "string?",
    "lastContactAt": "Date?",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
]
```

#### Get single client

```http
GET /clients/:id
```

**Parameters:**
- `id` (string): Client ID

**Response:**
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "name": "string",
  "phone": "string",
  "email": "string?",
  "label": "consumidor" | "prospecto" | "afiliado",
  "notes": "string?",
  "lastContactAt": "Date?",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Create client manually

```http
POST /clients
```

**Request Body:**
```json
{
  "profileId": "uuid",
  "name": "string",
  "phone": "string",
  "email": "string?",
  "label": "consumidor" | "prospecto" | "afiliado",
  "notes": "string?"
}
```

**Response:** `201 Created`

#### Update client

```http
PUT /clients/:id
```

**Parameters:**
- `id` (string): Client ID

**Request Body:**
```json
{
  "name": "string?",
  "phone": "string?",
  "email": "string?",
  "label": "consumidor" | "prospecto" | "afiliado",
  "notes": "string?",
  "lastContactAt": "string?" // ISO date string
}
```

**Response:**
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "name": "string",
  "phone": "string",
  "email": "string?",
  "label": "consumidor" | "prospecto" | "afiliado",
  "notes": "string?",
  "lastContactAt": "Date?",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Delete client

```http
DELETE /clients/:id
```

**Parameters:**
- `id` (string): Client ID

**Response:** `204 No Content`

#### Get clients by label

```http
GET /clients/label/:label
```

**Parameters:**
- `label` (string): Label filter
  - `consumidor`
  - `prospecto`
  - `afiliado`

**Response:**
```json
[
  {
    "id": "uuid",
    "profileId": "uuid",
    "name": "string",
    "phone": "string",
    "email": "string?",
    "label": "consumidor" | "prospecto" | "afiliado",
    "notes": "string?",
    "lastContactAt": "Date?",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
]
```

#### Get clients without recent contact

```http
GET /clients/without-contact/:days
```

**Parameters:**
- `days` (number): Number of days since last contact

**Response:**
```json
[
  {
    "id": "uuid",
    "profileId": "uuid",
    "name": "string",
    "phone": "string",
    "email": "string?",
    "label": "consumidor" | "prospecto" | "afiliado",
    "notes": "string?",
    "lastContactAt": "Date?",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
]
```

#### Get client notes

```http
GET /clients/:id/notes
```

**Parameters:**
- `id` (string): Client ID

**Response:**
```json
[
  {
    "id": "uuid",
    "clientId": "uuid",
    "profileId": "uuid",
    "note": "string",
    "createdAt": "Date"
  }
]
```

#### Add client note

```http
POST /clients/:id/notes
```

**Parameters:**
- `id` (string): Client ID

**Request Body:**
```json
{
  "note": "string"
}
```

**Response:** `201 Created`

---

## Health Survey Integration Routes

### Base Path: `/health-survey`

#### Submit health survey (Public)

```http
POST /health-survey/public
```

**Request Body:**
```json
{
  "profileId": "uuid",
  "visitorName": "string",
  "visitorPhone": "string?",
  "visitorEmail": "string?",
  "visitorWhatsapp": "string?",
  "referredBy": "string?",
  "responses": {
    // Health survey responses
  }
}
```

**Response:** `201 Created`

#### List survey responses

```http
GET /health-survey?profileId=uuid
```

**Query Parameters:**
- `profileId` (string): Profile ID to filter responses

**Response:**
```json
[
  {
    "id": "uuid",
    "profileId": "uuid",
    "visitorName": "string",
    "visitorPhone": "string?",
    "visitorEmail": "string?",
    "visitorWhatsapp": "string?",
    "referredBy": "string?",
    "responses": {
      // Health survey responses
    },
    "whatsappSentAt": "Date?",
    "createdAt": "Date"
  }
]
```

#### Get latest survey response

```http
GET /health-survey/latest?profileId=uuid
```

**Query Parameters:**
- `profileId` (string): Profile ID to filter responses

**Response:**
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "visitorName": "string",
  "visitorPhone": "string?",
  "visitorEmail": "string?",
  "visitorWhatsapp": "string?",
  "referredBy": "string?",
  "responses": {
    // Health survey responses
  },
  "whatsappSentAt": "Date?",
  "createdAt": "Date"
}
```

#### Get survey statistics

```http
GET /health-survey/stats?profileId=uuid
```

**Query Parameters:**
- `profileId` (string): Profile ID to filter responses

**Response:**
```json
{
  "total": "number",
  "recent": "number",
  // Additional stats...
}
```

#### Get single survey response

```http
GET /health-survey/:id
```

**Parameters:**
- `id` (string): Survey response ID

**Response:**
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "visitorName": "string",
  "visitorPhone": "string?",
  "visitorEmail": "string?",
  "visitorWhatsapp": "string?",
  "referredBy": "string?",
  "responses": {
    // Health survey responses
  },
  "whatsappSentAt": "Date?",
  "createdAt": "Date"
}
```

#### **Create client from survey** ✨

```http
POST /health-survey/:id/create-client?profileId=uuid
```

**Parameters:**
- `id` (string): Survey response ID
- `profileId` (string): Profile ID (query parameter)

**Description:**
Converts a health survey response into a client record. This is the **explicit conversion** method from survey to client.

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "profileId": "uuid",
  "healthSurveyId": "uuid",
  "name": "string",
  "phone": "string",
  "email": "string?",
  "label": "prospecto",
  "notes": "string?",
  "lastContactAt": "Date?",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### **Bulk create clients from surveys** ✨

```http
POST /health-survey/bulk-create-clients?profileId=uuid
```

**Query Parameters:**
- `profileId` (string): Profile ID

**Request Body:**
```json
{
  "surveyIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** `207 Multi-Status`

```json
{
  "successful": "number",
  "failed": "number",
  "total": "number"
}
```

**Description:**
Converts multiple health survey responses into client records in bulk. Returns a summary of successful and failed conversions.

#### Update survey response

```http
PUT /health-survey/:id?profileId=uuid
```

**Parameters:**
- `id` (string): Survey response ID
- `profileId` (string): Profile ID (query parameter)

**Request Body:**
```json
{
  "visitorName": "string?",
  "visitorPhone": "string?",
  "visitorEmail": "string?",
  "visitorWhatsapp": "string?",
  "referredBy": "string?",
  "responses": {
    // Health survey responses
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "visitorName": "string",
  "visitorPhone": "string?",
  "visitorEmail": "string?",
  "visitorWhatsapp": "string?",
  "referredBy": "string?",
  "responses": {
    // Health survey responses
  },
  "whatsappSentAt": "Date?",
  "createdAt": "Date"
}
```

#### Delete survey response

```http
DELETE /health-survey/:id?profileId=uuid
```

**Parameters:**
- `id` (string): Survey response ID
- `profileId` (string): Profile ID (query parameter)

**Response:** `204 No Content`

#### Get survey responses by date range

```http
GET /health-survey/range/:startDate/:endDate?profileId=uuid
```

**Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `profileId` (string): Profile ID (query parameter)

**Response:**
```json
[
  {
    "id": "uuid",
    "profileId": "uuid",
    "visitorName": "string",
    "visitorPhone": "string?",
    "visitorEmail": "string?",
    "visitorWhatsapp": "string?",
    "referredBy": "string?",
    "responses": {
      // Health survey responses
    },
    "whatsappSentAt": "Date?",
    "createdAt": "Date"
  }
]
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "string",
  "message": "string?",
  "details": "object?"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content
- `207` - Multi-Status (bulk operations)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Client Label System

Clients can be categorized using three labels:

- **consumidor** - Regular consumers
- **prospecto** - Prospects (typically from surveys)
- **afiliado** - Affiliates

---

## Template Variables

Message templates support the following variables:

- `{nombre_cliente}` - Client's name
- `{nombre_asesor}` - Advisor's name (from profile)
- `{telefono}` - Client's phone/WhatsApp number
- `{fecha_actual}` - Current date (DD/MM/YYYY)
- `{hora_actual}` - Current time (HH:mm)

---

## Implementation Notes

### Service Pattern

All routes use the **servicesPlugin** for dependency injection:

```typescript
export const clientRoutes = new Elysia({ prefix: "/clients" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .get("/", async ({ ctx, services }) => {
    return services.clientService.getClients(ctx!);
  });
```

### Database Isolation

All operations are scoped to the authenticated user's profiles using the `RequestContext` pattern. Queries automatically filter by `userId` to ensure data isolation.

### Health Survey Integration

Survey responses can be explicitly converted to clients through:
1. **Single conversion** - `/health-survey/:id/create-client`
2. **Bulk conversion** - `/health-survey/bulk-create-clients`

This maintains data control and allows selective conversion of leads to clients.

---

## Files Reference

- **Routes:**
  - `packages/api/src/api/routes/client.ts` - Client management
  - `packages/api/src/api/routes/health-survey.ts` - Health survey + client creation

- **Services:**
  - `packages/api/src/services/business/client.ts` - ClientService
  - `packages/api/src/services/business/template-variables.ts` - TemplateVariablesService

- **Repositories:**
  - `packages/api/src/services/repository/client.ts` - ClientRepository
  - `packages/api/src/services/repository/client-note.ts` - ClientNoteRepository
