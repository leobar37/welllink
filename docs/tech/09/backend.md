# Backend Architecture - Mass Messaging with AI + WhatsApp

## Overview

This document defines the backend architecture for the Mass Messaging with AI feature, building upon the existing WhatsApp integration (Module 09) to enable advisors to send AI-generated messages at scale to their client base.

## Architecture Principles

### 1. Single-Tenant Isolation

- Each user (profile) has isolated client data, campaigns, and messaging history
- All operations scoped to the authenticated user's profileId
- No tenantId concept - pure single-tenant architecture
- WhatsApp instances remain per-profile (one instance per profile)

### 2. Async Processing

- Mass sending uses BullMQ queues with worker processes
- Campaign sending processed in batches to respect rate limits
- Real-time status updates via existing webhook system

### 3. AI Integration

- OpenAI GPT-4 for message generation with advisor personalization
- Context-aware prompt engineering using advisor profile and client data
- Rate limiting for AI API calls to control costs

## Database Schema

### Core Tables (Following project patterns)

#### 1. client

Stores all contacts/clients for an advisor. Leverages existing health-survey data.

```typescript
// packages/api/src/db/schema/client.ts
// packages/api/src/db/schema/client-note.ts
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { client } from "./client";
import { profile } from "./profile";

export const clientNote = pgTable(
  "client_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("client_note_client_id_idx").on(table.clientId),
    index("client_note_profile_id_idx").on(table.profileId),
  ],
);

export type ClientNote = typeof clientNote.$inferSelect;
export type NewClientNote = typeof clientNote.$inferInsert;
```

#### 3. campaignTemplate

Reusable message templates for campaigns.

```typescript
// packages/api/src/db/schema/campaign-template.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";

export const campaignTemplate = pgTable(
  "campaign_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    objective: varchar("objective", { length: 100 }),
    variables: jsonb("variables").$type<string[]>().notNull().default([]),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaign_template_profile_id_idx").on(table.profileId),
    index("campaign_template_name_idx").on(table.name),
  ],
);

export type CampaignTemplate = typeof campaignTemplate.$inferSelect;
export type NewCampaignTemplate = typeof campaignTemplate.$inferInsert;
```

#### 4. campaign

Mass messaging campaigns.

```typescript
// packages/api/src/db/schema/campaign.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { campaignTemplate } from "./campaign-template";

export enum CampaignStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export const campaign = pgTable(
  "campaign",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => campaignTemplate.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    objective: varchar("objective", { length: 100 }).notNull(),
    messageContent: text("message_content").notNull(),
    totalRecipients: integer("total_recipients").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    status: text("status", {
      enum: [
        CampaignStatus.DRAFT,
        CampaignStatus.SCHEDULED,
        CampaignStatus.SENDING,
        CampaignStatus.SENT,
        CampaignStatus.FAILED,
        CampaignStatus.CANCELLED,
      ],
    })
      .notNull()
      .default(CampaignStatus.DRAFT),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaign_profile_id_idx").on(table.profileId),
    index("campaign_status_idx").on(table.status),
    index("campaign_scheduled_at_idx").on(table.scheduledAt),
    index("campaign_template_id_idx").on(table.templateId),
  ],
);

export type Campaign = typeof campaign.$inferSelect;
export type NewCampaign = typeof campaign.$inferInsert;
```

#### 5. campaignAudience

Recipients of a campaign (many-to-many with client).

```typescript
// packages/api/src/db/schema/campaign-audience.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { campaign } from "./campaign";
import { client } from "./client";
import { whatsappMessage } from "./whatsapp-message";

export enum CampaignAudienceStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
}

export const campaignAudience = pgTable(
  "campaign_audience",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaign.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    whatsappMessageId: uuid("whatsapp_message_id").references(
      () => whatsappMessage.id,
      { onDelete: "set null" },
    ),
    status: text("status", {
      enum: [
        CampaignAudienceStatus.PENDING,
        CampaignAudienceStatus.SENT,
        CampaignAudienceStatus.DELIVERED,
        CampaignAudienceStatus.FAILED,
      ],
    })
      .notNull()
      .default(CampaignAudienceStatus.PENDING),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("campaign_audience_profile_id_idx").on(table.profileId),
    index("campaign_audience_campaign_id_idx").on(table.campaignId),
    index("campaign_audience_client_id_idx").on(table.clientId),
    index("campaign_audience_status_idx").on(table.status),
    index("campaign_audience_whatsapp_message_id_idx").on(
      table.whatsappMessageId,
    ),
    uniqueIndex("campaign_audience_campaign_client_idx").on(
      table.campaignId,
      table.clientId,
    ),
  ],
);

export type CampaignAudience = typeof campaignAudience.$inferSelect;
export type NewCampaignAudience = typeof campaignAudience.$inferInsert;
```

## Client Creation Methods

### Method 1: From Health Survey (Lead Capture)

When a health survey is submitted, advisors can manually convert it to a client.
This is done via an explicit API endpoint to maintain data control.

**Note**: `HealthSurveyService` remains unchanged. Client creation is handled by `ClientService` via route handlers.

```typescript
// NO CHANGES to HealthSurveyService - it remains as-is
// Client creation happens in route handlers or ClientService directly
```

### Method 2: Manual Client Creation

Advisors can create clients manually without a survey:

```typescript
// packages/api/src/services/business/client.ts
export class ClientService {
  async createClient(
    profileId: string,
    data: Omit<NewClient, "profileId">,
  ): Promise<Client> {
    if (!data.name) {
      throw new BadRequestException("Client name is required");
    }

    // WhatsApp is required (it's the primary contact method)
    if (!data.whatsapp) {
      throw new BadRequestException("WhatsApp number is required");
    }

    // Check if client already exists with same whatsapp
    const existing = await this.clientRepository.findByWhatsApp(
      profileId,
      data.whatsapp,
    );
    if (existing) {
      throw new BadRequestException("Client with this WhatsApp already exists");
    }

    return this.clientRepository.create({
      ...data,
      profileId,
      label: data.label || ClientLabel.CONSUMIDOR, // Default for manual creation
    } as NewClient);
  }

  async createClientFromSurvey(
    survey: HealthSurveyResponse,
    profileId: string,
  ): Promise<Client> {
    // Use visitorPhone for both phone and WhatsApp (single field approach)
    if (!survey.visitorPhone) {
      throw new BadRequestException(
        "Survey must have phone/WhatsApp number",
      );
    }

    const phone = survey.visitorPhone;

    // Check if client already exists
    const existing = await this.clientRepository.findByPhone(
      profileId,
      phone,
    );
    if (existing) {
      throw new BadRequestException("Client already exists from this survey");
    }

    return this.clientRepository.create({
      profileId,
      healthSurveyId: survey.id,
      name: survey.visitorName,
      phone: phone, // Used for both phone and WhatsApp
      email: survey.visitorEmail,
      label: ClientLabel.PROSPECTO, // Default for survey leads
    });
  }
}
```

### Use Cases

#### Survey-Based Creation

- **Source**: Health survey submission (explicit conversion)
- **Default Label**: Prospecto
- **Data**: From survey fields (visitorPhone used for both phone and WhatsApp)
- **Scenario**: New leads from website

#### Manual Creation

- **Source**: Advisor input
- **Default Label**: Consumidor (or chosen by advisor)
- **Data**: Entered manually
- **Required**: phone (used for both phone and WhatsApp), name
- **Optional**: email
- **Scenario**:
  - Existing contacts
  - Referrals
  - WhatsApp contacts
  - Walk-ins
  - Phone inquiries

## Services Layer

### 1. ClientRepository

```typescript
// packages/api/src/services/repository/client.ts
import { eq, and, like, desc, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { client, type Client, type NewClient } from "../../db/schema";
import type { ClientLabel } from "../../db/schema";

export class ClientRepository {
  async create(data: NewClient) {
    const [result] = await db.insert(client).values(data).returning();
    return result;
  }

  async findByProfile(profileId: string) {
    return db.query.client.findMany({
      where: eq(client.profileId, profileId),
      orderBy: desc(client.createdAt),
    });
  }

  async findById(profileId: string, id: string) {
    return db.query.client.findFirst({
      where: and(eq(client.id, id), eq(client.profileId, profileId)),
    });
  }

  async update(profileId: string, id: string, data: Partial<NewClient>) {
    const [result] = await db
      .update(client)
      .set(data)
      .where(and(eq(client.id, id), eq(client.profileId, profileId)))
      .returning();
    return result;
  }

  async delete(profileId: string, id: string) {
    const [result] = await db
      .delete(client)
      .where(and(eq(client.id, id), eq(client.profileId, profileId)))
      .returning();
    return result;
  }

  async findByPhone(profileId: string, phone: string) {
    return db.query.client.findFirst({
      where: and(eq(client.profileId, profileId), eq(client.phone, phone)),
    });
  }

  // Note: findByWhatsApp removed - use findByPhone instead, as phone field serves for both phone and WhatsApp

  async getByLabel(profileId: string, label: ClientLabel) {
    return db.query.client.findMany({
      where: and(eq(client.profileId, profileId), eq(client.label, label)),
      orderBy: desc(client.createdAt),
    });
  }

  async getWithoutRecentContact(profileId: string, daysSince: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);

    return db.query.client.findMany({
      where: and(
        eq(client.profileId, profileId),
        client.lastContactAt === null || lte(client.lastContactAt, cutoffDate),
      ),
      orderBy: desc(client.createdAt),
    });
  }
}
```

### 2. ClientService

```typescript
// packages/api/src/services/business/client.ts
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ClientRepository } from "../repository/client";
import { ClientNoteRepository } from "../repository/client-note";
import type { Client, NewClient, ClientLabel } from "../../db/schema/client";

export class ClientService {
  constructor(
    private clientRepository: ClientRepository,
    private clientNoteRepository: ClientNoteRepository,
  ) {}

  async getClients(profileId: string): Promise<Client[]> {
    return this.clientRepository.findByProfile(profileId);
  }

  async getClient(profileId: string, id: string): Promise<Client> {
    const client = await this.clientRepository.findById(profileId, id);
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    return client;
  }

  async createClient(
    profileId: string,
    data: Omit<NewClient, "profileId">,
  ): Promise<Client> {
    if (!data.name) {
      throw new BadRequestException("Client name is required");
    }

    // Phone/WhatsApp is required and used for both phone and WhatsApp communication
    if (!data.phone) {
      throw new BadRequestException("Phone/WhatsApp number is required");
    }

    // Check if client already exists with same phone/WhatsApp
    const existing = await this.clientRepository.findByPhone(profileId, data.phone);
    if (existing) {
      throw new BadRequestException("Client with this phone/WhatsApp already exists");
    }

    return this.clientRepository.create({
      ...data,
      profileId,
    } as NewClient);
  }

  async updateClient(
    profileId: string,
    id: string,
    data: Partial<NewClient>,
  ): Promise<Client> {
    const existingClient = await this.clientRepository.findById(profileId, id);
    if (!existingClient) {
      throw new NotFoundException("Client not found");
    }

    return this.clientRepository.update(profileId, id, data);
  }

  async deleteClient(profileId: string, id: string): Promise<void> {
    const existingClient = await this.clientRepository.findById(profileId, id);
    if (!existingClient) {
      throw new NotFoundException("Client not found");
    }

    await this.clientRepository.delete(profileId, id);
  }

  async getClientsByLabel(
    profileId: string,
    label: ClientLabel,
  ): Promise<Client[]> {
    return this.clientRepository.getByLabel(profileId, label);
  }

  async getClientsWithoutContact(
    profileId: string,
    daysSince: number,
  ): Promise<Client[]> {
    return this.clientRepository.getWithoutRecentContact(profileId, daysSince);
  }

  async addNote(profileId: string, clientId: string, note: string) {
    const client = await this.clientRepository.findById(profileId, clientId);
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    return this.clientNoteRepository.create({
      clientId,
      profileId,
      note,
    });
  }

  async getNotes(profileId: string, clientId: string) {
    return this.clientNoteRepository.findByClientId(profileId, clientId);
  }
}
```

### 3. CampaignTemplateRepository

```typescript
// packages/api/src/services/repository/campaign-template.ts
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  campaignTemplate,
  type CampaignTemplate,
  type NewCampaignTemplate,
} from "../../db/schema";

export class CampaignTemplateRepository {
  async create(data: NewCampaignTemplate) {
    const [result] = await db.insert(campaignTemplate).values(data).returning();
    return result;
  }

  async findByProfile(profileId: string) {
    return db.query.campaignTemplate.findMany({
      where: eq(campaignTemplate.profileId, profileId),
      orderBy: desc(campaignTemplate.lastUsedAt),
    });
  }

  async findById(profileId: string, id: string) {
    return db.query.campaignTemplate.findFirst({
      where: and(
        eq(campaignTemplate.id, id),
        eq(campaignTemplate.profileId, profileId),
      ),
    });
  }

  async update(
    profileId: string,
    id: string,
    data: Partial<NewCampaignTemplate>,
  ) {
    const [result] = await db
      .update(campaignTemplate)
      .set(data)
      .where(
        and(
          eq(campaignTemplate.id, id),
          eq(campaignTemplate.profileId, profileId),
        ),
      )
      .returning();
    return result;
  }

  async delete(profileId: string, id: string) {
    const [result] = await db
      .delete(campaignTemplate)
      .where(
        and(
          eq(campaignTemplate.id, id),
          eq(campaignTemplate.profileId, profileId),
        ),
      )
      .returning();
    return result;
  }

  async incrementUsage(profileId: string, id: string) {
    const [result] = await db
      .update(campaignTemplate)
      .set({
        usageCount: campaignTemplate.usageCount + 1,
        lastUsedAt: new Date(),
      })
      .where(
        and(
          eq(campaignTemplate.id, id),
          eq(campaignTemplate.profileId, profileId),
        ),
      )
      .returning();

    return result;
  }

  // Note: getByObjective method removed - segmentation by objective is not practical
  // as advisors write objectives freely rather than selecting from predefined options
}
```

### 4. CampaignTemplateService

```typescript
// packages/api/src/services/business/campaign-template.ts
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { CampaignTemplateRepository } from "../repository/campaign-template";
import type {
  CampaignTemplate,
  NewCampaignTemplate,
} from "../../db/schema/campaign-template";

export class CampaignTemplateService {
  constructor(private campaignTemplateRepository: CampaignTemplateRepository) {}

  async getTemplates(profileId: string): Promise<CampaignTemplate[]> {
    return this.campaignTemplateRepository.findByProfile(profileId);
  }

  async getTemplate(profileId: string, id: string): Promise<CampaignTemplate> {
    const template = await this.campaignTemplateRepository.findById(
      profileId,
      id,
    );
    if (!template) {
      throw new NotFoundException("Template not found");
    }
    return template;
  }

  async createTemplate(
    profileId: string,
    data: Omit<NewCampaignTemplate, "profileId">,
  ): Promise<CampaignTemplate> {
    if (!data.name) {
      throw new BadRequestException("Template name is required");
    }

    if (!data.content) {
      throw new BadRequestException("Template content is required");
    }

    return this.campaignTemplateRepository.create({
      ...data,
      profileId,
    } as NewCampaignTemplate);
  }

  async updateTemplate(
    profileId: string,
    id: string,
    data: Partial<NewCampaignTemplate>,
  ): Promise<CampaignTemplate> {
    const existingTemplate = await this.campaignTemplateRepository.findById(
      profileId,
      id,
    );
    if (!existingTemplate) {
      throw new NotFoundException("Template not found");
    }

    return this.campaignTemplateRepository.update(profileId, id, data);
  }

  async deleteTemplate(profileId: string, id: string): Promise<void> {
    const existingTemplate = await this.campaignTemplateRepository.findById(
      profileId,
      id,
    );
    if (!existingTemplate) {
      throw new NotFoundException("Template not found");
    }

    await this.campaignTemplateRepository.delete(profileId, id);
  }

  async useTemplate(profileId: string, id: string): Promise<CampaignTemplate> {
    return this.campaignTemplateRepository.incrementUsage(profileId, id);
  }

  // Note: getTemplatesByObjective method removed - segmentation by objective is not practical
  // as advisors write objectives freely rather than selecting from predefined options
}
```

## Message Variables & Templates

### Available Variables

You can use these variables in your message templates:

- `{nombre_cliente}` - Client's name
- `{nombre_asesor}` - Advisor's name
- `{telefono}` - Client's phone/WhatsApp number
- `{fecha_actual}` - Current date (format: DD/MM/YYYY)
- `{hora_actual}` - Current time (format: HH:mm)

### Template Variables Type System

```typescript
// packages/api/src/services/business/template-variables.ts
import { format } from "date-fns";
import { ProfileRepository } from "../repository/profile";
import { ClientRepository } from "../repository/client";
import type { RequestContext } from "../../types/context";

export const TEMPLATE_VARIABLES = {
  NOMBRE_CLIENTE: "{nombre_cliente}",
  NOMBRE_ASESOR: "{nombre_asesor}",
  TELEFONO: "{telefono}",
  FECHA_ACTUAL: "{fecha_actual}",
  HORA_ACTUAL: "{hora_actual}",
} as const;

export type TemplateVariable =
  (typeof TEMPLATE_VARIABLES)[keyof typeof TEMPLATE_VARIABLES];

export interface VariableScope {
  type: "client" | "advisor" | "system";
  entityId?: string;
}

export interface TemplateVariableData {
  clientName: string;
  advisorName: string;
  phone: string;
}

export class TemplateVariablesService {
  constructor(
    private profileRepository: ProfileRepository,
    private clientRepository: ClientRepository
  ) {}

  /**
   * Replaces variables in a template with actual values
   * Supports lazy loading for complex variables
   */
  async replaceVariables(
    template: string,
    context: RequestContext,
    scopes: VariableScope[]
  ): Promise<string> {
    const variableMap = await this.buildVariableMap(context, scopes);

    return this.replaceAllVariables(template, variableMap);
  }

  /**
   * Extracts all variables from a template
   */
  extractVariables(template: string): string[] {
    const regex = /{(\w+)}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      matches.push(`{${match[1]}}`);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Validates that all variables in a template are supported
   */
  validateTemplate(template: string): {
    valid: boolean;
    invalidVariables: string[];
  } {
    const extracted = this.extractVariables(template);
    const validVariables = Object.values(TEMPLATE_VARIABLES);
    const invalidVariables = extracted.filter(
      (v) => !validVariables.includes(v as TemplateVariable),
    );

    return {
      valid: invalidVariables.length === 0,
      invalidVariables,
    };
  }

  /**
   * Builds a map of variables to values based on scopes
   * Uses lazy loading for expensive operations
   */
  private async buildVariableMap(
    context: RequestContext,
    scopes: VariableScope[]
  ): Promise<Record<string, string>> {
    const variableMap: Record<string, string> = {};
    const now = new Date();

    // System variables (always available)
    variableMap[TEMPLATE_VARIABLES.FECHA_ACTUAL] = format(now, "dd/MM/yyyy");
    variableMap[TEMPLATE_VARIABLES.HORA_ACTUAL] = format(now, "HH:mm");

    // Process each scope
    for (const scope of scopes) {
      switch (scope.type) {
        case "client":
          if (scope.entityId) {
            await this.addClientVariables(variableMap, context, scope.entityId);
          }
          break;
        case "advisor":
          await this.addAdvisorVariables(variableMap, context);
          break;
      }
    }

    return variableMap;
  }

  /**
   * Adds client-scoped variables (lazy loaded)
   */
  private async addClientVariables(
    variableMap: Record<string, string>,
    context: RequestContext,
    clientId: string
  ): Promise<void> {
    const client = await this.clientRepository.findById(context.userId, clientId);
    if (!client) return;

    variableMap[TEMPLATE_VARIABLES.NOMBRE_CLIENTE] = client.name;
    variableMap[TEMPLATE_VARIABLES.TELEFONO] = client.phone;
  }

  /**
   * Adds advisor-scoped variables (lazy loaded)
   */
  private async addAdvisorVariables(
    variableMap: Record<string, string>,
    context: RequestContext
  ): Promise<void> {
    const profile = await this.profileRepository.findByUserId(context.userId);
    if (!profile) return;

    variableMap[TEMPLATE_VARIABLES.NOMBRE_ASESOR] = profile.displayName;
  }

  /**
   * Performs variable replacement using a prepared map
   */
  private replaceAllVariables(
    template: string,
    variableMap: Record<string, string>
  ): string {
    let result = template;

    for (const [variable, value] of Object.entries(variableMap)) {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, ''), 'g'), value);
    }

    return result;
  }
}
```

### Example Templates

#### Template 1: Follow-up

```
Hola {nombre_cliente}! 👋

Soy {nombre_asesor}, hope you're having a great day!

Just wanted to check in - have you had a chance to think about our products?

Feel free to reach out at {telefono} if you have any questions.

Best regards!
```

#### Template 2: Promotion

```
🎉 ¡Hola {nombre_cliente}!

{nombre_asesor} here with an exclusive offer just for you.

We're having a special promotion this month that you might love!

Reply to this message or call {telefono} for details.

Valid until: {fecha_actual}
```

#### From Scratch (No Template)

```
¡Hola {nombre_cliente}!

Soy {nombre_asesor}, tu asesor de bienestar.

¿Te gustaría conocer nuestros productos para aumentar tu energía natural?

Contáctame: {telefono}
```

### Variable Scopes

The template variable system supports three scopes:

1. **System scope**: Always available variables like `{fecha_actual}`, `{hora_actual}`
2. **Client scope**: Client-specific variables like `{nombre_cliente}`, `{telefono}` (requires clientId)
3. **Advisor scope**: Advisor-specific variables like `{nombre_asesor}`

### Template System

The template system allows you to:

1. **Save frequently used messages** as templates
2. **Reuse templates** across multiple campaigns
3. **Track template usage** (usage count)
4. **Edit templates** anytime
5. **Use scoped variables** for personalization

### Creating a Campaign

You have two options:

#### Option A: Use Template

1. Select an existing template or create new one
2. Template automatically populates messageContent
3. Variables will be replaced when sending

#### Option B: Write From Scratch

1. Click "Create New Message"
2. Write your message directly
3. Optionally save as template for future use
4. Variables work the same way

### AI Assistance

The AI service helps you:

1. **Generate message variations** based on objective and tone
2. **Improve existing messages** for better engagement
3. **Suggest templates** based on your past campaigns
4. **Personalize messages** using client notes and history

**Important**: AI is a separate service. It doesn't store data in the campaign or template tables. It only helps generate content that you then save manually.

## API Routes

### Client Management Routes

```typescript
// packages/api/src/api/routes/client.ts
import { t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { contextPlugin } from "../../plugins/context";
import { authGuard } from "../../middleware/auth-guard";
import type { ClientLabel } from "../../db/schema/client";

export const clientRoutes = new Elysia({ prefix: "/clients" })
  .use(servicesPlugin)
  .use(contextPlugin)
  .use(authGuard)

  // List all clients
  .get("/", ({ clientService, ctx }) => clientService.getClients(ctx!.userId))

  // Get single client
  .get("/:id", ({ clientService, ctx, params }) =>
    clientService.getClient(ctx!.userId, params.id),
  )

  // Create client manually (Method 2)
  .post(
    "/",
    async ({ clientService, ctx, body, set }) => {
      set.status = 201;
      return clientService.createClient(ctx!.userId, body);
    },
    {
      body: t.Object({
        name: t.String(),
        phone: t.String(), // Required - used for both phone and WhatsApp
        email: t.Optional(t.String()),
        label: t
          .Union([
            t.Literal("consumidor"),
            t.Literal("prospecto"),
            t.Literal("afiliado"),
          ])
          .optional(), // Defaults to CONSUMIDOR
      }),
    },
  )

  // Update client
  .put("/:id", ({ clientService, ctx, params, body }) =>
    clientService.updateClient(ctx!.userId, params.id, body),
  )

  // Delete client
  .delete("/:id", ({ clientService, ctx, params }) =>
    clientService.deleteClient(ctx!.userId, params.id),
  )

  // Get clients by label
  .get("/label/:label", ({ clientService, ctx, params }) =>
    clientService.getClientsByLabel(ctx!.userId, params.label as ClientLabel),
  )

  // Get clients without recent contact
  .get("/without-contact/:days", ({ clientService, ctx, params }) =>
    clientService.getClientsWithoutContact(ctx!.userId, Number(params.days)),
  )

  // Get client notes
  .get("/:id/notes", ({ clientService, ctx, params }) =>
    clientService.getNotes(ctx!.userId, params.id),
  )

  // Add client note
  .post(
    "/:id/notes",
    ({ clientService, ctx, params, body, set }) => {
      set.status = 201;
      return clientService.addNote(ctx!.userId, params.id, body.note);
    },
    {
      body: t.Object({
        note: t.String(),
      }),
    },
  );
```

### Health Survey Integration Routes

```typescript
// packages/api/src/api/routes/health-survey.ts
import { t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { contextPlugin } from "../../plugins/context";
import { authGuard } from "../../middleware/auth-guard";

export const healthSurveyRoutes = new Elysia({ prefix: "/health-survey" })
  .use(servicesPlugin)
  .use(contextPlugin)
  .use(authGuard)

  // Create client from survey (Method 1 - explicit action)
  .post(
    "/:id/create-client",
    async ({ healthSurveyService, clientService, ctx, params, set }) => {
      // Get survey response
      const survey = await healthSurveyService.getSurveyResponse(params.id);

      // Create client from survey using ClientService
      const client = await clientService.createClientFromSurvey(
        survey,
        ctx!.userId,
      );

      set.status = 201;
      return client;
    },
  )

  // Bulk create clients from multiple surveys
  .post(
    "/bulk-create-clients",
    async ({ healthSurveyService, clientService, ctx, body, set }) => {
      const { surveyIds } = body;

      const results = await Promise.allSettled(
        surveyIds.map(async (surveyId: string) => {
          const survey = await healthSurveyService.getSurveyResponse(surveyId);
          return clientService.createClientFromSurvey(survey, ctx!.userId);
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      set.status = 207; // Multi-Status
      return {
        successful,
        failed,
        total: surveyIds.length,
      };
    },
    {
      body: t.Object({
        surveyIds: t.Array(t.String()),
      }),
    },
  );
```

## Message Sending Flow

### Campaign Queue Service

```typescript
// packages/api/src/services/queue/campaign-queue.ts
import { Queue, Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import { CampaignRepository } from "../repository/campaign";
import { CampaignAudienceRepository } from "../repository/campaign-audience";
import { ClientRepository } from "../repository/client";
import { WhatsAppQueueService } from "./whatsapp-queue";
import { TemplateVariablesService } from "../business/template-variables";
import { CampaignStatus, CampaignAudienceStatus } from "../../db/schema";
import type { RequestContext } from "../../types/context";

export interface CampaignQueueJobData {
  campaignId: string;
  profileId: string;
  ctx: RequestContext;
}

export class CampaignQueueService {
  private queue: Queue;
  private worker: Worker;

  constructor(
    private redisConnection: Redis,
    private campaignRepository: CampaignRepository,
    private campaignAudienceRepository: CampaignAudienceRepository,
    private clientRepository: ClientRepository,
    private templateVariablesService: TemplateVariablesService,
    private whatsappQueue: WhatsAppQueueService,
  ) {
    // Initialize queue
    this.queue = new Queue("campaign-sending", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1, // Campaigns don't retry at job level
      },
    });

    // Initialize worker
    this.worker = new Worker(
      "campaign-sending",
      async (job: Job<CampaignQueueJobData>) => {
        await this.processCampaign(job);
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process 5 campaigns in parallel max
      },
    );

    // Event listeners
    this.worker.on("completed", (job: Job) => {
      console.log(`Campaign job completed: ${job.id}`);
    });

    this.worker.on("failed", (job: Job | undefined, err: Error) => {
      console.error(`Campaign job failed: ${job?.id}`, err);
    });
  }

  async addCampaignJob(campaignId: string, profileId: string, ctx: RequestContext) {
    return this.queue.add("send-campaign", {
      campaignId,
      profileId,
      ctx,
    });
  }

  private async processCampaign(job: Job<CampaignQueueJobData>) {
    const { campaignId, profileId, ctx } = job.data;

    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(
        profileId,
        campaignId,
      );
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Update campaign status to SENDING
      await this.campaignRepository.update(profileId, campaignId, {
        status: CampaignStatus.SENDING,
      });

      // Get all audience members for this campaign
      const audienceMembers =
        await this.campaignAudienceRepository.findByCampaign(
          ctx,
          campaignId,
        );

      if (audienceMembers.length === 0) {
        throw new Error("Campaign has no recipients");
      }

      // Process in batches of 50 (rate limit)
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < audienceMembers.length; i += BATCH_SIZE) {
        batches.push(audienceMembers.slice(i, i + BATCH_SIZE));
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const batch of batches) {
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(async (audienceMember) => {
            const client = await this.clientRepository.findById(
              profileId,
              audienceMember.clientId,
            );

            if (!client) {
              throw new Error(`Client not found: ${audienceMember.clientId}`);
            }

            // Replace variables in message using the service with scopes
            const personalizedMessage = await this.templateVariablesService.replaceVariables(
              campaign.messageContent,
              ctx,
              [
                { type: "client", entityId: client.id },
                { type: "advisor" },
                { type: "system" },
              ]
            );

            // Create WhatsApp message and add to queue
            const whatsappMessageId = crypto.randomUUID();
            await this.whatsappQueue.addSendMessageJob(
              whatsappMessageId,
              profileId, // configId (one config per profile)
              {
                to: client.phone, // phone field used for WhatsApp
                content: personalizedMessage,
              },
            );

            // Update audience member status
            await this.campaignAudienceRepository.update(
              ctx,
              audienceMember.id,
              {
                whatsappMessageId,
                status: CampaignAudienceStatus.SENT,
                sentAt: new Date(),
              },
            );

            return { success: true };
          }),
        );

        // Count results
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            sentCount++;
          } else {
            failedCount++;
          }
        });

        // Wait 60 seconds between batches (rate limiting: 50 msg/min)
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }

      // Update campaign final status
      await this.campaignRepository.update(profileId, campaignId, {
        status: sentCount > 0 ? CampaignStatus.SENT : CampaignStatus.FAILED,
        sentCount,
        failedCount,
        sentAt: new Date(),
      });

      return {
        campaignId,
        sentCount,
        failedCount,
        totalRecipients: audienceMembers.length,
      };
    } catch (error) {
      // Mark campaign as failed
      await this.campaignRepository.update(profileId, campaignId, {
        status: CampaignStatus.FAILED,
      });

      throw error;
    }
  }

  async getQueueStatus() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}

// Singleton instance
let campaignQueueInstance: CampaignQueueService | null = null;

export async function getCampaignQueue(
  redisConnection: Redis,
  campaignRepository: CampaignRepository,
  campaignAudienceRepository: CampaignAudienceRepository,
  clientRepository: ClientRepository,
  templateVariablesService: TemplateVariablesService,
  whatsappQueue: WhatsAppQueueService,
): Promise<CampaignQueueService> {
  if (!campaignQueueInstance) {
    campaignQueueInstance = new CampaignQueueService(
      redisConnection,
      campaignRepository,
      campaignAudienceRepository,
      clientRepository,
      templateVariablesService,
      whatsappQueue,
    );
  }
  return campaignQueueInstance;
}
```

### Campaign Audience Repository

```typescript
// packages/api/src/services/repository/campaign-audience.ts
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  campaignAudience,
  type CampaignAudience,
  type NewCampaignAudience,
} from "../../db/schema";
import type { RequestContext } from "../../types/context";

export class CampaignAudienceRepository {
  async create(data: NewCampaignAudience) {
    const [result] = await db.insert(campaignAudience).values(data).returning();
    return result;
  }

  async createMany(data: NewCampaignAudience[]) {
    return db.insert(campaignAudience).values(data).returning();
  }

  async findByCampaign(ctx: RequestContext, campaignId: string) {
    return db.query.campaignAudience.findMany({
      where: and(
        eq(campaignAudience.profileId, ctx.profileId),
        eq(campaignAudience.campaignId, campaignId),
      ),
      orderBy: desc(campaignAudience.createdAt),
    });
  }

  async findById(ctx: RequestContext, id: string) {
    return db.query.campaignAudience.findFirst({
      where: and(
        eq(campaignAudience.id, id),
        eq(campaignAudience.profileId, ctx.profileId),
      ),
    });
  }

  async update(
    ctx: RequestContext,
    id: string,
    data: Partial<NewCampaignAudience>,
  ) {
    const [result] = await db
      .update(campaignAudience)
      .set(data)
      .where(
        and(
          eq(campaignAudience.id, id),
          eq(campaignAudience.profileId, ctx.profileId),
        ),
      )
      .returning();
    return result;
  }

  async getByStatus(ctx: RequestContext, campaignId: string, status: string) {
    return db.query.campaignAudience.findMany({
      where: and(
        eq(campaignAudience.profileId, ctx.profileId),
        eq(campaignAudience.campaignId, campaignId),
        eq(campaignAudience.status, status),
      ),
    });
  }
}
```

## Error Handling

### Campaign Sending Errors

- **Network errors**: Retry with exponential backoff
- **Invalid phone numbers**: Mark as failed, log error
- **WhatsApp API errors**: Pause campaign, notify advisor
- **Rate limit exceeded**: Delay batch, resume automatically

### AI Generation Errors

- **API timeout**: Use cached template as fallback
- **API error**: Return error message to advisor
- **Content policy violation**: Regenerate with modified prompt

## Security Considerations

### Data Protection

- Client phone numbers and whatsapp stored as-is (no encryption for searchability)
- AI prompts and responses logged for debugging

### Access Control

- All operations require authentication via authGuard
- Profile-scoped data access (always filter by profileId)
- Rate limiting per user to prevent abuse

### WhatsApp Compliance

- No medical claims in messages
- Include business identification in first message
- Respect client preferences and communication frequency

## Performance Optimization

### Database

- Indexes on frequently queried fields (profileId, phone, status)
- campaign_audience table can be partitioned for large campaigns
- Template variables use lazy loading to avoid unnecessary queries

### Caching

- Redis cache for AI personalization profiles
- Client lists cached for 5 minutes
- Campaign analytics cached for 1 hour

### Queue Management

- Separate queues for campaign sending and retries
- Configurable batch sizes (default: 50 messages per batch)
- Worker auto-scaling for high-volume periods
- RequestContext pattern reduces redundant profile lookups

## Monitoring & Metrics

### Campaign Metrics

- Messages sent per campaign
- Delivery rate by user
- Average send time
- Campaign completion rate

### AI Metrics

- Message generation success rate
- Average generation time
- Token usage per user
- Most common objectives and tones

### System Metrics

- Queue length and processing time
- Worker utilization
- Database query performance
- WhatsApp API response times

## Service Registration

### Update plugins/services.ts

To integrate the new services into the application, update the DI container:

```typescript
// packages/api/src/plugins/services.ts
import { Elysia } from "elysia";
// ... existing imports ...

// ADD NEW IMPORTS
import { ClientRepository } from "../services/repository/client";
import { ClientNoteRepository } from "../services/repository/client-note";
import { CampaignTemplateRepository } from "../services/repository/campaign-template";
import { CampaignRepository } from "../services/repository/campaign";
import { CampaignAudienceRepository } from "../services/repository/campaign-audience";

import { ClientService } from "../services/business/client";
import { CampaignTemplateService } from "../services/business/campaign-template";
import { CampaignService } from "../services/business/campaign";

import { getCampaignQueue } from "../services/queue/campaign-queue";

export const servicesPlugin = new Elysia({ name: "services" }).derive(
  { as: "global" },
  async () => {
    const storage = await getStorageInstance();

    // Existing repositories...
    const assetRepository = new AssetRepository();
    const profileRepository = new ProfileRepository();
    // ... other existing repositories ...

    // NEW REPOSITORIES
    const clientRepository = new ClientRepository();
    const clientNoteRepository = new ClientNoteRepository();
    const campaignTemplateRepository = new CampaignTemplateRepository();
    const campaignRepository = new CampaignRepository();
    const campaignAudienceRepository = new CampaignAudienceRepository();

    // Evolution API service (existing)
    const evolutionService = new EvolutionService({
      baseUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
      apiKey: process.env.EVOLUTION_API_KEY || "",
    });

    // WhatsApp queue (existing)
    const redisConnection = getRedisConnection();
    const whatsappQueue = await getWhatsAppQueue(
      redisConnection,
      whatsappMessageRepository,
      whatsappConfigRepository,
      evolutionService,
    );

    // NEW QUEUE: Campaign queue
    const campaignQueue = await getCampaignQueue(
      redisConnection,
      campaignRepository,
      campaignAudienceRepository,
      clientRepository,
      profileRepository,
      whatsappQueue,
    );

    // Existing services...
    const assetService = new AssetService(assetRepository, storage);
    // ... other existing services ...

    // NEW SERVICES
    const clientService = new ClientService(
      clientRepository,
      clientNoteRepository,
    );

    const campaignTemplateService = new CampaignTemplateService(
      campaignTemplateRepository,
    );

    const campaignService = new CampaignService(
      campaignRepository,
      campaignAudienceRepository,
      clientRepository,
      campaignQueue,
    );

    return {
      services: {
        storage,
        redis: redisConnection,

        // Existing repositories
        assetRepository,
        profileRepository,
        // ... other existing repositories ...

        // NEW REPOSITORIES
        clientRepository,
        clientNoteRepository,
        campaignTemplateRepository,
        campaignRepository,
        campaignAudienceRepository,

        // Existing services
        assetService,
        cdnService,
        profileService,
        // ... other existing services ...

        // NEW SERVICES
        clientService,
        campaignTemplateService,
        campaignService,

        // Queues
        whatsappQueue,
        campaignQueue, // NEW
      },
    };
  },
);
```

### Schema Index Export

Update the schema index to export new tables:

```typescript
// packages/api/src/db/schema/index.ts

// Enums
export * from "./enums";

// Better Auth tables
export * from "./auth";

// Application tables
export * from "./asset";
export * from "./profile";
export * from "./profile-customization";
export * from "./social-link";
export * from "./health-survey";
export * from "./analytics";
export * from "./story-section";
export * from "./story";
export * from "./story-event";
export * from "./ai-recommendation";
export * from "./whatsapp-config";
export * from "./whatsapp-message";
export * from "./whatsapp-template";

// NEW TABLES
export * from "./client";
export * from "./client-note";
export * from "./campaign-template";
export * from "./campaign";
export * from "./campaign-audience";

// Relations
export * from "./relations";
```

## Summary of Changes

### Fixed Issues

1. ✅ **Phone/WhatsApp Consistency**: Unified `phone` and `whatsapp` fields - now only `phone` exists and serves both purposes
2. ✅ **Removed getByObjective**: Eliminated objective-based segmentation from CampaignTemplateRepository and CampaignTemplateService (not practical for free-text objectives)
3. ✅ **TemplateVariablesService**: Converted from static functions to a proper service with dependency injection, scope support (client/advisor/system), and lazy loading
4. ✅ **RequestContext Pattern**: Added RequestContext to CampaignAudienceRepository for proper authentication and scoping
5. ✅ **Variable Naming**: Updated `{whatsapp}` variable to `{telefono}` to match single-field approach

### New Files to Create

1. `packages/api/src/db/schema/client.ts`
2. `packages/api/src/db/schema/client-note.ts`
3. `packages/api/src/db/schema/campaign-template.ts`
4. `packages/api/src/db/schema/campaign.ts`
5. `packages/api/src/db/schema/campaign-audience.ts`
6. `packages/api/src/services/repository/client.ts`
7. `packages/api/src/services/repository/client-note.ts`
8. `packages/api/src/services/repository/campaign-template.ts`
9. `packages/api/src/services/repository/campaign.ts`
10. `packages/api/src/services/repository/campaign-audience.ts`
11. `packages/api/src/services/business/client.ts`
12. `packages/api/src/services/business/campaign-template.ts`
13. `packages/api/src/services/business/campaign.ts`
14. `packages/api/src/services/business/template-variables.ts` **(NEW)**
15. `packages/api/src/services/queue/campaign-queue.ts`
16. `packages/api/src/api/routes/client.ts`
17. `packages/api/src/api/routes/campaign.ts`
18. `packages/api/src/api/routes/campaign-template.ts`

### Updated Files

1. `packages/api/src/db/schema/index.ts` - Export new tables
2. `packages/api/src/plugins/services.ts` - Register new services including TemplateVariablesService
