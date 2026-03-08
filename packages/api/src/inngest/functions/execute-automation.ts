import { inngest } from "../../lib/inngest-client";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { automation } from "../../db/schema/automation";
import { automationTrigger } from "../../db/schema/automation-trigger";
import { automationAction } from "../../db/schema/automation-action";
import { automationExecutionLog } from "../../db/schema/automation-execution-log";
import { profile } from "../../db/schema/profile";
import { WhatsAppActionConfig, EmailActionConfig, UpdateRecordActionConfig, CreateTaskActionConfig } from "../../db/schema/automation-action";
import { EventTriggerConfig, ScheduleTriggerConfig, ConditionTriggerConfig } from "../../db/schema/automation-trigger";
import { EvolutionService } from "../../services/business/evolution-api";
import { env } from "../../config/env";
import type { MedicalReservationEvents } from "../../types/inngest-events";

// Type for automation events
type AutomationExecuteEvent = MedicalReservationEvents["automation/execute"]["data"];
type AutomationRetryEvent = MedicalReservationEvents["automation/retry"]["data"];

/**
 * Automation execution result
 */
interface ExecutionResult {
  success: boolean;
  actionsExecuted: Array<{
    actionId: string;
    actionName: string;
    actionType: string;
    success: boolean;
    result?: Record<string, unknown>;
    error?: string;
  }>;
  error?: string;
}

/**
 * Get profile's WhatsApp configuration
 */
async function getWhatsAppConfig(profileId: string) {
  const { whatsappConfig } = await import("../../db/schema/whatsapp-config");
  
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

  return configs[0] || null;
}

/**
 * Resolve a variable from trigger data (exported for testing)
 */
export function resolveVariable(data: Record<string, unknown>, variablePath?: string): unknown {
  if (!variablePath) return undefined;
  
  const keys = variablePath.split('.');
  let current: unknown = data;
  
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
 * Resolve message variables from trigger data (exported for testing)
 */
export function resolveMessage(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = resolveVariable(data, path.trim());
    return value !== undefined ? String(value) : `{{${path}}}`;
  });
}

/**
 * Execute a WhatsApp action (exported for testing)
 */
export async function executeWhatsAppAction(
  config: WhatsAppActionConfig,
  triggerData: Record<string, unknown>,
  profileId: string,
  evolutionService: EvolutionService
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    let phoneNumber: string | undefined;

    switch (config.recipientType) {
      case "phone":
        phoneNumber = config.phoneNumber;
        break;
      case "client":
        if (config.clientId) {
          const { client } = await import("../../db/schema/client");
          const clientRecord = await db.query.client.findFirst({
            where: eq(client.id, config.clientId),
          });
          phoneNumber = clientRecord?.phone ?? undefined;
        }
        break;
      case "variable":
        phoneNumber = resolveVariable(triggerData, config.variablePath) as string | undefined;
        break;
    }

    if (!phoneNumber) {
      return { success: false, error: "No phone number found for recipient" };
    }

    const message = resolveMessage(config.message, triggerData);
    const whatsAppConfig = await getWhatsAppConfig(profileId);

    if (!whatsAppConfig) {
      return { success: false, error: "No active WhatsApp configuration for profile" };
    }

    const formattedPhone = evolutionService.formatPhoneNumber(phoneNumber);
    const result = await evolutionService.sendText(whatsAppConfig.instanceName, {
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
 * Execute an email action (exported for testing)
 */
export async function executeEmailAction(
  config: EmailActionConfig,
  triggerData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    let email: string | undefined;

    switch (config.recipientType) {
      case "email":
        email = config.email;
        break;
      case "client":
        if (config.clientId) {
          const { client } = await import("../../db/schema/client");
          const clientRecord = await db.query.client.findFirst({
            where: eq(client.id, config.clientId),
          });
          email = clientRecord?.email ?? undefined;
        }
        break;
      case "variable":
        email = resolveVariable(triggerData, config.variablePath) as string | undefined;
        break;
    }

    if (!email) {
      return { success: false, error: "No email address found for recipient" };
    }

    const subject = resolveMessage(config.subject, triggerData);
    const body = resolveMessage(config.body, triggerData);

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
 * Execute an update record action (exported for testing)
 */
export async function executeUpdateRecordAction(
  config: UpdateRecordActionConfig,
  triggerData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    let entityId: string | undefined;

    switch (config.entityIdType) {
      case "fixed":
        entityId = config.entityId;
        break;
      case "variable":
        entityId = resolveVariable(triggerData, config.entityIdVariablePath) as string | undefined;
        break;
    }

    if (!entityId) {
      return { success: false, error: "No entity ID found" };
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.updates)) {
      if (typeof value === "string" && value.startsWith("$")) {
        const varPath = value.slice(1);
        updates[key] = resolveVariable(triggerData, varPath);
      } else {
        updates[key] = value;
      }
    }

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
 * Execute a create task action (exported for testing)
 */
export async function executeCreateTaskAction(
  config: CreateTaskActionConfig,
  triggerData: Record<string, unknown>,
  profileId: string
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    const title = resolveMessage(config.title, triggerData);
    const description = config.description 
      ? resolveMessage(config.description, triggerData) 
      : undefined;

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
        assigneeId = resolveVariable(triggerData, config.assignToVariablePath) as string | undefined;
        break;
    }

    let dueDate: Date | undefined;

    switch (config.dueDateType) {
      case "absolute":
        dueDate = config.absoluteDueDate ? new Date(config.absoluteDueDate) : undefined;
        break;
      case "relative":
        if (config.relativeDueDate) {
          const match = config.relativeDueDate.match(/^\+(\d+)([dwmy])$/);
          if (match) {
            const amount = parseInt(match[1], 10);
            const unit = match[2];
            dueDate = new Date();
            switch (unit) {
              case "d": dueDate.setDate(dueDate.getDate() + amount); break;
              case "w": dueDate.setDate(dueDate.getDate() + (amount * 7)); break;
              case "m": dueDate.setMonth(dueDate.getMonth() + amount); break;
              case "y": dueDate.setFullYear(dueDate.getFullYear() + amount); break;
            }
          }
        }
        break;
      case "variable":
        const resolvedDate = resolveVariable(triggerData, config.dueDateVariablePath) as string | undefined;
        if (resolvedDate) {
          dueDate = new Date(resolvedDate);
        }
        break;
    }

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
 * Evaluate an event trigger (exported for testing)
 */
export function evaluateEventTrigger(
  triggerConfig: EventTriggerConfig,
  eventData: Record<string, unknown>
): { shouldTrigger: boolean; reason?: string } {
  if (triggerConfig.eventType !== eventData.type) {
    return { shouldTrigger: false };
  }

  if (triggerConfig.filters && Object.keys(triggerConfig.filters).length > 0) {
    for (const [key, expectedValue] of Object.entries(triggerConfig.filters)) {
      const actualValue = resolveVariable(eventData, key);
      
      if (expectedValue === undefined || expectedValue === null) {
        continue;
      }

      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          return { 
            shouldTrigger: false, 
            reason: `Filter mismatch: ${key}` 
          };
        }
      } else {
        if (actualValue !== expectedValue) {
          return { 
            shouldTrigger: false, 
            reason: `Filter mismatch: ${key}` 
          };
        }
      }
    }
  }

  return { shouldTrigger: true };
}

/**
 * Execute automation actions in sequence
 */
async function executeActions(
  actions: typeof automationAction.$inferSelect[],
  triggerData: Record<string, unknown>,
  profileId: string,
  evolutionService: EvolutionService
): Promise<ExecutionResult> {
  const actionsExecuted: ExecutionResult["actionsExecuted"] = [];
  let hasFailure = false;

  for (const action of actions) {
    console.log(`[AUTOMATION] Executing action: ${action.name || action.id} (${action.type})`);

    let result: { success: boolean; result?: Record<string, unknown>; error?: string };

    switch (action.type) {
      case "whatsapp":
        result = await executeWhatsAppAction(
          action.config as WhatsAppActionConfig,
          triggerData,
          profileId,
          evolutionService
        );
        break;
      case "email":
        result = await executeEmailAction(
          action.config as EmailActionConfig,
          triggerData
        );
        break;
      case "update_record":
        result = await executeUpdateRecordAction(
          action.config as UpdateRecordActionConfig,
          triggerData
        );
        break;
      case "create_task":
        result = await executeCreateTaskAction(
          action.config as CreateTaskActionConfig,
          triggerData,
          profileId
        );
        break;
      default:
        result = { success: false, error: `Unknown action type: ${action.type}` };
    }

    actionsExecuted.push({
      actionId: action.id,
      actionName: action.name || action.type,
      actionType: action.type,
      success: result.success,
      result: result.result,
      error: result.error,
    });

    if (!result.success && !action.continueOnError) {
      console.log(`[AUTOMATION] Action failed and continueOnError is false, stopping execution`);
      hasFailure = true;
      break;
    }
  }

  const allSuccess = actionsExecuted.every(a => a.success);
  const someSuccess = actionsExecuted.some(a => a.success);

  return {
    success: allSuccess,
    actionsExecuted,
    error: hasFailure ? "One or more actions failed" : undefined,
  };
}

/**
 * Process a single automation
 */
async function processAutomation(
  automationData: typeof automation.$inferSelect,
  triggerData: Record<string, unknown>,
  triggerType: string,
  evolutionService: EvolutionService
): Promise<{ executed: boolean; result?: ExecutionResult }> {
  console.log(`[AUTOMATION] Processing automation: ${automationData.name} (${automationData.id})`);

  // Get triggers for this automation
  const triggers = await db.query.automationTrigger.findMany({
    where: and(
      eq(automationTrigger.automationId, automationData.id),
      eq(automationTrigger.isActive, true)
    ),
  });

  // Check if any trigger should fire
  let shouldTrigger = false;
  
  for (const trigger of triggers) {
    if (trigger.type === "event" && triggerType === "event") {
      const config = trigger.config as EventTriggerConfig;
      const evaluation = evaluateEventTrigger(config, triggerData);
      if (evaluation.shouldTrigger) {
        shouldTrigger = true;
        console.log(`[AUTOMATION] Event trigger matched: ${trigger.name || trigger.id}`);
        break;
      }
    } else if (trigger.type === "schedule" && triggerType === "schedule") {
      shouldTrigger = true;
      console.log(`[AUTOMATION] Schedule trigger matched: ${trigger.name || trigger.id}`);
      break;
    } else if (trigger.type === "condition" && triggerType === "condition") {
      shouldTrigger = true;
      console.log(`[AUTOMATION] Condition trigger matched: ${trigger.name || trigger.id}`);
      break;
    }
  }

  if (!shouldTrigger) {
    console.log(`[AUTOMATION] No triggers matched for automation: ${automationData.name}`);
    return { executed: false };
  }

  // Create execution log
  const [executionLog] = await db.insert(automationExecutionLog).values({
    automationId: automationData.id,
    triggerType,
    triggerData,
    status: "running",
    startedAt: new Date(),
  }).returning();

  console.log(`[AUTOMATION] Execution log created: ${executionLog.id}`);

  // Get active actions for this automation
  const actions = await db.query.automationAction.findMany({
    where: and(
      eq(automationAction.automationId, automationData.id),
      eq(automationAction.isActive, true)
    ),
    orderBy: [automationAction.order],
  });

  if (actions.length === 0) {
    console.log(`[AUTOMATION] No active actions for automation: ${automationData.name}`);
    
    await db.update(automationExecutionLog)
      .set({ 
        status: "success",
        completedAt: new Date(),
        result: { message: "No actions to execute" },
      })
      .where(eq(automationExecutionLog.id, executionLog.id));

    return { executed: true, result: { success: true, actionsExecuted: [] } };
  }

  // Execute actions
  const result = await executeActions(actions, triggerData, automationData.profileId, evolutionService);

  // Update execution log with results
  await db.update(automationExecutionLog)
    .set({ 
      status: result.success ? "success" : (result.actionsExecuted.some(a => a.success) ? "partial" : "failed"),
      actionsExecuted: result.actionsExecuted,
      completedAt: new Date(),
      error: result.error,
    })
    .where(eq(automationExecutionLog.id, executionLog.id));

  console.log(`[AUTOMATION] Execution completed with status: ${result.success ? "success" : (result.actionsExecuted.some(a => a.success) ? "partial" : "failed")}`);

  return { executed: true, result };
}

/**
 * Main automation execution function
 */
export const executeAutomation = inngest.createFunction(
  {
    id: "execute-automation",
    name: "Execute Automation",
  },
  { event: "automation/execute" },
  async ({ event, logger }: { event: { data: AutomationExecuteEvent }; logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn?: (...args: unknown[]) => void; debug?: (...args: unknown[]) => void } }) => {
    logger.info("Automation execution triggered", { 
      automationId: event.data.automationId,
      profileId: event.data.profileId,
      triggerType: event.data.triggerType,
    });

    const evolutionService = new EvolutionService({
      baseUrl: env.EVOLUTION_API_URL,
      apiKey: env.EVOLUTION_API_KEY,
    });

    try {
      const profileId = event.data.profileId;
      const triggerData = event.data.triggerData;
      const triggerType = event.data.triggerType;

      // Get automations to process
      let automations: typeof automation.$inferSelect[];

      if (event.data.automationId) {
        // Execute specific automation
        const automationData = await db.query.automation.findFirst({
          where: eq(automation.id, event.data.automationId),
        });
        
        automations = automationData ? [automationData] : [];
      } else {
        // Get all enabled automations for the profile
        automations = await db.query.automation.findMany({
          where: and(
            eq(automation.profileId, profileId),
            eq(automation.enabled, true)
          ),
        });
      }

      logger.info(`Found ${automations.length} automations to evaluate`);

      const results: Array<{
        automationId: string;
        automationName: string;
        executed: boolean;
        success?: boolean;
        error?: string;
      }> = [];

      // Process each automation
      for (const automationData of automations) {
        try {
          const result = await processAutomation(
            automationData,
            triggerData,
            triggerType,
            evolutionService
          );

          results.push({
            automationId: automationData.id,
            automationName: automationData.name,
            executed: result.executed,
            success: result.result?.success,
            error: result.result?.error,
          });
        } catch (error) {
          logger.error(`Error processing automation ${automationData.id}`, { error });
          results.push({
            automationId: automationData.id,
            automationName: automationData.name,
            executed: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const executedCount = results.filter(r => r.executed).length;
      const successCount = results.filter(r => r.success).length;

      logger.info(`Automation execution completed: ${executedCount} executed, ${successCount} successful`);

      return {
        success: true,
        profileId,
        totalAutomations: automations.length,
        executed: executedCount,
        successful: successCount,
        results,
      };
    } catch (error) {
      logger.error("Automation execution failed", { error });
      throw error;
    }
  }
);

/**
 * Cron job for schedule-based automations
 */
export const runScheduledAutomations = inngest.createFunction(
  {
    id: "run-scheduled-automations",
    name: "Run Scheduled Automations",
  },
  { cron: "* * * * *" }, // Every minute - in production, would be less frequent
  async ({ logger }: { logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn?: (...args: unknown[]) => void; debug?: (...args: unknown[]) => void } }) => {
    logger.info("Scheduled automation check started");

    const evolutionService = new EvolutionService({
      baseUrl: env.EVOLUTION_API_URL,
      apiKey: env.EVOLUTION_API_KEY,
    });

    // Get all enabled automations with schedule triggers
    const automations = await db.query.automation.findMany({
      where: eq(automation.enabled, true),
    });

    const results: Array<{
      automationId: string;
      automationName: string;
      executed: boolean;
      success?: boolean;
    }> = [];

    for (const automationData of automations) {
      // Get schedule triggers for this automation
      const triggers = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "schedule"),
          eq(automationTrigger.isActive, true)
        ),
      });

      if (triggers.length === 0) {
        continue;
      }

      // For now, execute all schedule triggers (in production, would evaluate cron)
      const result = await processAutomation(
        automationData,
        { cronRun: true, timestamp: new Date().toISOString() },
        "schedule",
        evolutionService
      );

      results.push({
        automationId: automationData.id,
        automationName: automationData.name,
        executed: result.executed,
        success: result.result?.success,
      });
    }

    logger.info(`Scheduled automation check completed: ${results.length} processed`);

    return {
      success: true,
      processed: results.length,
      results,
    };
  }
);

/**
 * Retry a failed automation execution
 */
export const retryAutomationExecution = inngest.createFunction(
  {
    id: "retry-automation-execution",
    name: "Retry Automation Execution",
  },
  { event: "automation/retry" },
  async ({ event, logger }: { event: { data: AutomationRetryEvent }; logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn?: (...args: unknown[]) => void; debug?: (...args: unknown[]) => void } }) => {
    logger.info("Automation retry triggered", { 
      executionLogId: event.data.executionLogId,
      automationId: event.data.automationId,
    });

    const evolutionService = new EvolutionService({
      baseUrl: env.EVOLUTION_API_URL,
      apiKey: env.EVOLUTION_API_KEY,
    });

    // Get the original execution log
    const executionLog = await db.query.automationExecutionLog.findFirst({
      where: eq(automationExecutionLog.id, event.data.executionLogId),
    });

    if (!executionLog) {
      throw new Error(`Execution log not found: ${event.data.executionLogId}`);
    }

    // Get the automation
    const automationData = await db.query.automation.findFirst({
      where: eq(automation.id, event.data.automationId),
    });

    if (!automationData) {
      throw new Error(`Automation not found: ${event.data.automationId}`);
    }

    // Re-execute with the original trigger data
    const result = await processAutomation(
      automationData,
      event.data.triggerData,
      executionLog.triggerType || "event",
      evolutionService
    );

    return {
      success: result.result?.success || false,
      executionLogId: event.data.executionLogId,
      result: result.result,
    };
  }
);
