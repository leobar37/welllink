import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { profile } from "../../db/schema/profile";
import { whatsappConfig } from "../../db/schema/whatsapp-config";
import { client } from "../../db/schema/client";
import { EvolutionService } from "./evolution-api";
import type { 
  WhatsAppActionConfig, 
  EmailActionConfig, 
  UpdateRecordActionConfig, 
  CreateTaskActionConfig 
} from "../../db/schema/automation-action";
import type { EventTriggerConfig, ConditionTriggerConfig } from "../../db/schema/automation-trigger";

export interface ActionResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export interface TriggerEvaluationResult {
  shouldTrigger: boolean;
  reason?: string;
}

/**
 * Service for evaluating triggers and executing automation actions
 */
export class AutomationService {
  private evolutionService: EvolutionService;

  constructor(evolutionService: EvolutionService) {
    this.evolutionService = evolutionService;
  }

  /**
   * Evaluate an event trigger against incoming event data
   */
  evaluateEventTrigger(
    triggerConfig: EventTriggerConfig,
    eventData: Record<string, unknown>
  ): TriggerEvaluationResult {
    // Check if event type matches
    if (triggerConfig.eventType !== eventData.type) {
      return { shouldTrigger: false };
    }

    // If there are filters, evaluate them
    if (triggerConfig.filters && Object.keys(triggerConfig.filters).length > 0) {
      for (const [key, expectedValue] of Object.entries(triggerConfig.filters)) {
        const actualValue = this.getNestedValue(eventData, key);
        
        if (expectedValue === undefined || expectedValue === null) {
          continue;
        }

        // Handle array of acceptable values
        if (Array.isArray(expectedValue)) {
          if (!expectedValue.includes(actualValue)) {
            return { 
              shouldTrigger: false, 
              reason: `Filter mismatch: ${key} expected one of ${expectedValue.join(', ')}, got ${actualValue}` 
            };
          }
        } else {
          if (actualValue !== expectedValue) {
            return { 
              shouldTrigger: false, 
              reason: `Filter mismatch: ${key} expected ${expectedValue}, got ${actualValue}` 
            };
          }
        }
      }
    }

    return { shouldTrigger: true };
  }

  /**
   * Evaluate a condition trigger against current database state
   */
  async evaluateConditionTrigger(
    triggerConfig: ConditionTriggerConfig,
    profileId: string
  ): Promise<TriggerEvaluationResult> {
    try {
      // This would need to be extended based on the entity type
      // For now, we'll return true as condition evaluation is complex
      // and depends on specific entity queries
      return { shouldTrigger: true };
    } catch (error) {
      return { 
        shouldTrigger: false, 
        reason: error instanceof Error ? error.message : "Unknown error evaluating condition" 
      };
    }
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Resolve a variable from trigger data
   */
  private resolveVariable(
    data: Record<string, unknown>,
    variablePath?: string
  ): unknown {
    if (!variablePath) return undefined;
    return this.getNestedValue(data, variablePath);
  }

  /**
   * Execute a WhatsApp action
   */
  async executeWhatsAppAction(
    config: WhatsAppActionConfig,
    triggerData: Record<string, unknown>,
    profileId: string
  ): Promise<ActionResult> {
    try {
      // Determine recipient
      let phoneNumber: string | undefined;

      switch (config.recipientType) {
        case "phone":
          phoneNumber = config.phoneNumber;
          break;
        case "client":
          if (config.clientId) {
            const clientRecord = await db.query.client.findFirst({
              where: eq(client.id, config.clientId),
            });
            phoneNumber = clientRecord?.phone ?? undefined;
          }
          break;
        case "variable":
          const resolvedPhone = this.resolveVariable(triggerData, config.variablePath) as string | undefined;
          phoneNumber = resolvedPhone;
          break;
      }

      if (!phoneNumber) {
        return { success: false, error: "No phone number found for recipient" };
      }

      // Resolve message with variables
      const message = this.resolveMessage(config.message, triggerData);

      // Get WhatsApp configuration for the profile
      const configs = await db
        .select()
        .from(whatsappConfig)
        .where(
          and(
            eq(whatsappConfig.profileId, profileId),
            eq(whatsappConfig.isEnabled, true),
            eq(whatsappConfig.isConnected, true)
          )
        )
        .limit(1);

      if (configs.length === 0) {
        return { success: false, error: "No active WhatsApp configuration for profile" };
      }

      // Send the message
      const formattedPhone = this.evolutionService.formatPhoneNumber(phoneNumber);
      const result = await this.evolutionService.sendText(configs[0].instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { 
        success: true, 
        result: { messageId: result.key?.id, to: phoneNumber } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error sending WhatsApp" 
      };
    }
  }

  /**
   * Execute an email action
   */
  async executeEmailAction(
    config: EmailActionConfig,
    triggerData: Record<string, unknown>,
    profileId: string
  ): Promise<ActionResult> {
    try {
      // Determine recipient
      let email: string | undefined;

      switch (config.recipientType) {
        case "email":
          email = config.email;
          break;
        case "client":
          if (config.clientId) {
            const clientRecord = await db.query.client.findFirst({
              where: eq(client.id, config.clientId),
            });
            email = clientRecord?.email ?? undefined;
          }
          break;
        case "variable":
          const resolvedEmail = this.resolveVariable(triggerData, config.variablePath) as string | undefined;
          email = resolvedEmail;
          break;
      }

      if (!email) {
        return { success: false, error: "No email address found for recipient" };
      }

      // Resolve subject and body with variables
      const subject = this.resolveMessage(config.subject, triggerData);
      const body = this.resolveMessage(config.body, triggerData);

      // For now, we'll log the email (actual email sending would require SMTP config)
      console.log(`[EMAIL] Sending to: ${email}`);
      console.log(`[EMAIL] Subject: ${subject}`);
      console.log(`[EMAIL] Body: ${body}`);

      return { 
        success: true, 
        result: { to: email, subject } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error sending email" 
      };
    }
  }

  /**
   * Execute an update record action
   */
  async executeUpdateRecordAction(
    config: UpdateRecordActionConfig,
    triggerData: Record<string, unknown>
  ): Promise<ActionResult> {
    try {
      // Determine entity ID
      let entityId: string | undefined;

      switch (config.entityIdType) {
        case "fixed":
          entityId = config.entityId;
          break;
        case "variable":
          entityId = this.resolveVariable(triggerData, config.entityIdVariablePath) as string | undefined;
          break;
      }

      if (!entityId) {
        return { success: false, error: "No entity ID found" };
      }

      // Resolve update values with variables
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(config.updates)) {
        if (typeof value === "string" && value.startsWith("$")) {
          // Variable reference
          const varPath = value.slice(1);
          updates[key] = this.resolveVariable(triggerData, varPath);
        } else {
          updates[key] = value;
        }
      }

      // Execute the update based on entity type
      // This would need to be extended for other entity types
      console.log(`[UPDATE RECORD] Entity: ${config.entityType}, ID: ${entityId}`);
      console.log(`[UPDATE RECORD] Updates:`, updates);

      return { 
        success: true, 
        result: { entityType: config.entityType, entityId, updates } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error updating record" 
      };
    }
  }

  /**
   * Execute a create task action
   */
  async executeCreateTaskAction(
    config: CreateTaskActionConfig,
    triggerData: Record<string, unknown>,
    profileId: string
  ): Promise<ActionResult> {
    try {
      // Resolve title and description with variables
      const title = this.resolveMessage(config.title, triggerData);
      const description = config.description 
        ? this.resolveMessage(config.description, triggerData) 
        : undefined;

      // Determine assignee
      let assigneeId: string | undefined;

      switch (config.assignToType) {
        case "owner":
          const profileRecord = await db.query.profile.findFirst({
            where: eq(profile.id, profileId),
          });
          assigneeId = profileRecord?.userId;
          break;
        case "staff":
          assigneeId = config.staffId;
          break;
        case "variable":
          assigneeId = this.resolveVariable(triggerData, config.assignToVariablePath) as string | undefined;
          break;
      }

      // Determine due date
      let dueDate: Date | undefined;

      switch (config.dueDateType) {
        case "absolute":
          dueDate = config.absoluteDueDate ? new Date(config.absoluteDueDate) : undefined;
          break;
        case "relative":
          if (config.relativeDueDate) {
            dueDate = this.parseRelativeDate(config.relativeDueDate);
          }
          break;
        case "variable":
          const resolvedDate = this.resolveVariable(triggerData, config.dueDateVariablePath) as string | undefined;
          if (resolvedDate) {
            dueDate = new Date(resolvedDate);
          }
          break;
      }

      // Log the task creation (actual task creation would require a task table)
      console.log(`[CREATE TASK] Creating task:`);
      console.log(`[CREATE TASK] Title: ${title}`);
      console.log(`[CREATE TASK] Description: ${description}`);
      console.log(`[CREATE TASK] Assignee: ${assigneeId}`);
      console.log(`[CREATE TASK] Due Date: ${dueDate?.toISOString()}`);
      console.log(`[CREATE TASK] Priority: ${config.priority}`);

      return { 
        success: true, 
        result: { 
          title, 
          description, 
          assigneeId, 
          dueDate: dueDate?.toISOString(),
          priority: config.priority 
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error creating task" 
      };
    }
  }

  /**
   * Resolve message variables from trigger data
   * Supports {{variable.path}} syntax
   */
  private resolveMessage(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : `{{${path}}}`;
    });
  }

  /**
   * Parse relative date string (e.g., "+1d", "+2w", "+1m")
   */
  private parseRelativeDate(relativeDate: string): Date {
    const match = relativeDate.match(/^\+(\d+)([dwmy])$/);
    if (!match) {
      return new Date(); // Return current date if invalid format
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const date = new Date();

    switch (unit) {
      case "d":
        date.setDate(date.getDate() + amount);
        break;
      case "w":
        date.setDate(date.getDate() + (amount * 7));
        break;
      case "m":
        date.setMonth(date.getMonth() + amount);
        break;
      case "y":
        date.setFullYear(date.getFullYear() + amount);
        break;
    }

    return date;
  }
}
