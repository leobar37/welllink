import type { AutomationTemplateRepository } from "../repository/automation-template";
import type { AutomationRepository } from "../repository/automation";
import type { AutomationTriggerRepository } from "../repository/automation-trigger";
import type { AutomationActionRepository } from "../repository/automation-action";
import type { ProfileRepository } from "../repository/profile";
import type { NewAutomationTrigger } from "../../db/schema/automation-trigger";
import type { NewAutomationAction } from "../../db/schema/automation-action";
import type { TemplateTriggerConfig, TemplateActionConfig } from "../../db/schema/automation-template";

/**
 * Input for applying a template
 */
export interface ApplyTemplateInput {
  templateId: string;
  profileId: string;
  name?: string;
  description?: string;
}

/**
 * Service for managing automation templates
 */
export class AutomationTemplateService {
  constructor(
    private templateRepo: AutomationTemplateRepository,
    private automationRepo: AutomationRepository,
    private triggerRepo: AutomationTriggerRepository,
    private actionRepo: AutomationActionRepository,
    private profileRepo: ProfileRepository,
  ) {}

  /**
   * Get all templates, optionally filtered by business type
   */
  async getTemplates(businessTypeKey?: string, options?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    if (businessTypeKey) {
      return this.templateRepo.findByBusinessType(businessTypeKey, {
        isActive: options?.isActive ?? true,
        limit: options?.limit,
        offset: options?.offset,
      });
    }

    return this.templateRepo.findAll({
      businessTypeKey,
      category: options?.category,
      isActive: options?.isActive ?? true,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string) {
    return this.templateRepo.findById(id);
  }

  /**
   * Get available categories for templates
   */
  async getCategories(businessTypeKey?: string) {
    return this.templateRepo.getCategories(businessTypeKey);
  }

  /**
   * Apply a template to create an automation
   * This creates a new automation with the template's configuration
   */
  async applyTemplate(input: ApplyTemplateInput) {
    // Get the template
    const template = await this.templateRepo.findById(input.templateId);
    if (!template) {
      throw new Error("Plantilla no encontrada");
    }

    if (!template.isActive) {
      throw new Error("La plantilla no está disponible");
    }

    // Verify the profile exists
    const profile = await this.profileRepo.findById(input.profileId);
    if (!profile) {
      throw new Error("Perfil no encontrado");
    }

    // Create the automation with template's default values or custom values
    const automation = await this.automationRepo.create({
      profileId: input.profileId,
      name: input.name || template.defaultName || template.name,
      description: input.description || template.defaultDescription || template.description,
      enabled: true,
    });

    // Create triggers from template
    if (template.triggerConfig) {
      const triggerData = this.convertTemplateTriggerToTrigger(template.triggerConfig);
      await this.triggerRepo.create({
        automationId: automation.id,
        ...triggerData,
      });
    }

    // Create actions from template
    if (template.actionConfigs && template.actionConfigs.length > 0) {
      for (let i = 0; i < template.actionConfigs.length; i++) {
        const actionConfig = template.actionConfigs[i];
        const actionData = this.convertTemplateActionToAction(actionConfig);
        await this.actionRepo.create({
          automationId: automation.id,
          ...actionData,
        });
      }
    }

    // Increment usage count
    await this.templateRepo.incrementUsageCount(input.templateId);

    // Return the created automation with its triggers and actions
    const triggers = await this.triggerRepo.findByAutomationId(automation.id);
    const actions = await this.actionRepo.findByAutomationId(automation.id);

    return {
      automation: {
        ...automation,
        triggers,
        actions,
      },
      template: {
        id: template.id,
        name: template.name,
      },
    };
  }

  /**
   * Convert template trigger config to trigger data
   */
  private convertTemplateTriggerToTrigger(config: TemplateTriggerConfig): Omit<NewAutomationTrigger, "automationId"> {
    // Convert template config to full trigger config
    let fullConfig: any = {};

    if (config.type === "event") {
      fullConfig = {
        eventType: config.eventType || "",
        filters: {},
      };
    } else if (config.type === "schedule") {
      fullConfig = {
        cronExpression: config.cronExpression || "0 9 * * *",
        timezone: "America/Lima",
        daysOfWeek: config.daysOfWeek,
        hours: config.hours,
      };
    } else if (config.type === "condition") {
      fullConfig = {
        entityType: "appointment",
        conditions: config.conditions || [],
        logicalOperator: "AND",
        pollInterval: 60,
      };
    }

    return {
      type: config.type,
      name: `${config.type} trigger`,
      config: fullConfig,
      isActive: true,
    };
  }

  /**
   * Convert template action config to action data
   */
  private convertTemplateActionToAction(config: TemplateActionConfig): Omit<NewAutomationAction, "automationId"> {
    let fullConfig: any = {};

    switch (config.type) {
      case "whatsapp":
        fullConfig = {
          recipientType: config.recipientType || "client",
          phoneNumber: config.phoneNumber,
          clientId: config.clientId,
          variablePath: config.variablePath,
          message: config.message || "",
          templateId: config.templateId,
        };
        break;
      case "email":
        fullConfig = {
          recipientType: config.recipientType || "client",
          email: config.email,
          clientId: config.clientId,
          variablePath: config.variablePath,
          subject: config.subject || "",
          body: config.body || "",
          fromName: config.fromName,
        };
        break;
      case "update_record":
        fullConfig = {
          entityType: config.entityType || "appointment",
          entityIdType: config.entityIdType || "variable",
          entityId: config.entityId,
          entityIdVariablePath: config.entityIdVariablePath || "appointment.id",
          updates: config.updates || {},
        };
        break;
      case "create_task":
        fullConfig = {
          title: config.title || "",
          description: config.description,
          assignToType: config.assignToType || "owner",
          staffId: config.staffId,
          assignToVariablePath: config.assignToVariablePath,
          dueDateType: config.dueDateType || "relative",
          relativeDueDate: config.relativeDueDate || "+1d",
          absoluteDueDate: config.absoluteDueDate,
          dueDateVariablePath: config.dueDateVariablePath,
          priority: config.priority || "normal",
        };
        break;
    }

    return {
      type: config.type,
      name: config.name,
      order: config.order || 0,
      config: fullConfig,
      isActive: true,
      timeoutSeconds: 30,
      continueOnError: false,
    };
  }
}
