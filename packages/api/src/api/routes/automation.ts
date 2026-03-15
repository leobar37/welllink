import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import type { NewAutomationTrigger } from "../../db/schema/automation-trigger";
import type { NewAutomationAction } from "../../db/schema/automation-action";

// Trigger configuration validation
const eventTriggerConfig = t.Object({
  eventType: t.String(),
  filters: t.Optional(t.Record(t.String(), t.Unknown())),
});

const scheduleTriggerConfig = t.Object({
  cronExpression: t.String(),
  timezone: t.Optional(t.String()),
  daysOfWeek: t.Optional(t.Array(t.Number())),
  hours: t.Optional(t.Array(t.Number())),
});

const conditionTriggerConfig = t.Object({
  entityType: t.String(),
  conditions: t.Array(t.Object({
    field: t.String(),
    operator: t.Union([
      t.Literal("eq"),
      t.Literal("neq"),
      t.Literal("gt"),
      t.Literal("gte"),
      t.Literal("lt"),
      t.Literal("lte"),
      t.Literal("contains"),
      t.Literal("in"),
      t.Literal("is_null"),
    ]),
    value: t.Unknown(),
  })),
  logicalOperator: t.Optional(t.Union([t.Literal("AND"), t.Literal("OR")])),
  pollInterval: t.Optional(t.Number()),
});

// Action configuration validation
const whatsappActionConfig = t.Object({
  recipientType: t.Union([t.Literal("client"), t.Literal("phone"), t.Literal("variable")]),
  phoneNumber: t.Optional(t.String()),
  clientId: t.Optional(t.String()),
  variablePath: t.Optional(t.String()),
  message: t.String(),
  templateId: t.Optional(t.String()),
});

const emailActionConfig = t.Object({
  recipientType: t.Union([t.Literal("client"), t.Literal("email"), t.Literal("variable")]),
  email: t.Optional(t.String()),
  clientId: t.Optional(t.String()),
  variablePath: t.Optional(t.String()),
  subject: t.String(),
  body: t.String(),
  fromName: t.Optional(t.String()),
});

const updateRecordActionConfig = t.Object({
  entityType: t.String(),
  entityIdType: t.Union([t.Literal("fixed"), t.Literal("variable")]),
  entityId: t.Optional(t.String()),
  entityIdVariablePath: t.Optional(t.String()),
  updates: t.Record(t.String(), t.Unknown()),
});

const createTaskActionConfig = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  assignToType: t.Union([t.Literal("staff"), t.Literal("owner"), t.Literal("variable")]),
  staffId: t.Optional(t.String()),
  assignToVariablePath: t.Optional(t.String()),
  dueDateType: t.Union([t.Literal("relative"), t.Literal("absolute"), t.Literal("variable")]),
  relativeDueDate: t.Optional(t.String()),
  absoluteDueDate: t.Optional(t.String()),
  dueDateVariablePath: t.Optional(t.String()),
  priority: t.Union([t.Literal("low"), t.Literal("normal"), t.Literal("high")]),
});

export const automationRoutes = new Elysia({ prefix: "/automations" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)

  // ========================================
  // TEMPLATES
  // ========================================

  // Get all templates (optionally filtered by business type)
  .get(
    "/templates",
    async ({ query, services }) => {
      const businessTypeKey = query.businessType as string | undefined;
      const category = query.category as string | undefined;
      const limit = query.limit ? parseInt(query.limit as string) : undefined;
      const offset = query.offset ? parseInt(query.offset as string) : undefined;

      return services.automationTemplateService.getTemplates(businessTypeKey, {
        category,
        isActive: true,
        limit,
        offset,
      });
    },
    {
      detail: {
        tags: ["Automation"],
        summary: "Listar plantillas de automatizaciones",
        description: "Obtiene una lista de plantillas de automatizaciones pre-configuradas, filtradas por tipo de negocio y categoría.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Lista de plantillas" },
        },
      },
      query: t.Object({
        businessType: t.Optional(t.String()),
        category: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  // Get template categories
  .get(
    "/templates/categories",
    async ({ query, services }) => {
      const businessTypeKey = query.businessType as string | undefined;
      return services.automationTemplateService.getCategories(businessTypeKey);
    },
    {
      detail: {
        tags: ["Automation"],
        summary: "Categorías de plantillas",
        description: "Obtiene las categorías disponibles de plantillas de automatizaciones.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Lista de categorías" },
        },
      },
      query: t.Object({
        businessType: t.Optional(t.String()),
      }),
    },
  )

  // Get single template by ID
  .get(
    "/templates/:id",
    async ({ params, services }) => {
      const template = await services.automationTemplateService.getTemplateById(params.id);
      if (!template) {
        throw new Error("Plantilla no encontrada");
      }
      return template;
    },
    {
      detail: {
        tags: ["Automation"],
        summary: "Obtener plantilla por ID",
        description: "Obtiene los detalles de una plantilla de automatización específica.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Plantilla encontrada" },
          "404": { description: "Plantilla no encontrada" },
        },
      },
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Apply template - create automation from template
  .post(
    "/templates/:id/apply",
    async ({ params, body, set, services, ctx }) => {
      // Get profile ID from body or user's default profile
      let profileId = body.profileId as string | undefined;

      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        profileId = profiles[0].id;
      }

      const result = await services.automationTemplateService.applyTemplate({
        templateId: params.id,
        profileId,
        name: body.name as string | undefined,
        description: body.description as string | undefined,
      });

      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    },
  )

  // ========================================
  // AUTOMATIONS CRUD
  // ========================================

  // List automations for a profile
  .get(
    "/",
    async ({ query, services, ctx }) => {
      const profileId = query.profileId as string;
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          return [];
        }
        return services.automationRepository.findByProfileId(profiles[0].id, {
          enabled: query.enabled === "true" ? true : query.enabled === "false" ? false : undefined,
          limit: query.limit ? parseInt(query.limit as string) : undefined,
          offset: query.offset ? parseInt(query.offset as string) : undefined,
        });
      }
      return services.automationRepository.findByProfileId(profileId, {
        enabled: query.enabled === "true" ? true : query.enabled === "false" ? false : undefined,
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        offset: query.offset ? parseInt(query.offset as string) : undefined,
      });
    },
    {
      detail: {
        tags: ["Automation"],
        summary: "Listar automatizaciones",
        description: "Obtiene una lista de automatizaciones para un perfil de negocio.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Lista de automatizaciones" },
        },
      },
      query: t.Object({
        profileId: t.Optional(t.String()),
        enabled: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  // Get single automation with triggers and actions
  .get(
    "/:id",
    async ({ params, services, ctx }) => {
      const automation = await services.automationRepository.findById(params.id);
      if (!automation) {
        throw new Error("Automatización no encontrada");
      }

      const triggers = await services.automationTriggerRepository.findByAutomationId(params.id);
      const actions = await services.automationActionRepository.findByAutomationId(params.id);

      return {
        ...automation,
        triggers,
        actions,
      };
    },
    {
      detail: {
        tags: ["Automation"],
        summary: "Obtener automatización por ID",
        description: "Obtiene los detalles de una automatización específica, incluyendo sus triggers y acciones.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Automatización encontrada" },
          "404": { description: "Automatización no encontrada" },
        },
      },
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Create automation
  .post(
    "/",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId = profileId;

      if (!targetProfileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      }

      const automation = await services.automationRepository.create({
        profileId: targetProfileId,
        name: body.name as string,
        description: body.description as string | undefined,
        enabled: body.enabled !== false,
        priority: body.priority as string | undefined,
      });

      // If triggers are provided, create them
      if (body.triggers && Array.isArray(body.triggers) && body.triggers.length > 0) {
        for (const trigger of body.triggers as any[]) {
          await services.automationTriggerRepository.create({
            automationId: automation.id,
            type: trigger.type,
            name: trigger.name,
            config: trigger.config,
            isActive: trigger.isActive !== false,
          });
        }
      }

      // If actions are provided, create them
      if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
        for (let i = 0; i < (body.actions as any[]).length; i++) {
          const action = (body.actions as any[])[i];
          await services.automationActionRepository.create({
            automationId: automation.id,
            type: action.type,
            name: action.name,
            order: action.order ?? i,
            config: action.config,
            isActive: action.isActive !== false,
            timeoutSeconds: action.timeoutSeconds,
            continueOnError: action.continueOnError,
          });
        }
      }

      set.status = 201;
      
      // Return the full automation with triggers and actions
      const triggers = await services.automationTriggerRepository.findByAutomationId(automation.id);
      const actions = await services.automationActionRepository.findByAutomationId(automation.id);
      
      return {
        ...automation,
        triggers,
        actions,
      };
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        priority: t.Optional(t.String()),
        triggers: t.Optional(t.Array(t.Object({
          type: t.Union([t.Literal("event"), t.Literal("schedule"), t.Literal("condition")]),
          name: t.Optional(t.String()),
          config: t.Union([eventTriggerConfig, scheduleTriggerConfig, conditionTriggerConfig]),
          isActive: t.Optional(t.Boolean()),
        }))),
        actions: t.Optional(t.Array(t.Object({
          type: t.Union([t.Literal("whatsapp"), t.Literal("email"), t.Literal("update_record"), t.Literal("create_task")]),
          name: t.Optional(t.String()),
          order: t.Optional(t.Number()),
          config: t.Union([whatsappActionConfig, emailActionConfig, updateRecordActionConfig, createTaskActionConfig]),
          isActive: t.Optional(t.Boolean()),
          timeoutSeconds: t.Optional(t.Number()),
          continueOnError: t.Optional(t.Boolean()),
        }))),
      }),
    },
  )

  // Update automation
  .patch(
    "/:id",
    async ({ params, body, services, ctx }) => {
      const existing = await services.automationRepository.findById(params.id);
      if (!existing) {
        throw new Error("Automatización no encontrada");
      }

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.enabled !== undefined) updateData.enabled = body.enabled;
      if (body.priority !== undefined) updateData.priority = body.priority;

      const automation = await services.automationRepository.update(params.id, updateData);

      return automation;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        priority: t.Optional(t.String()),
      }),
    },
  )

  // Delete automation
  .delete("/:id", async ({ params, services, ctx }) => {
    const existing = await services.automationRepository.findById(params.id);
    if (!existing) {
      throw new Error("Automatización no encontrada");
    }

    await services.automationRepository.delete(params.id);
    return { success: true, message: "Automatización eliminada" };
  })

  // Toggle automation enabled/disabled
  .post(
    "/:id/toggle",
    async ({ params, body, services, ctx }) => {
      const existing = await services.automationRepository.findById(params.id);
      if (!existing) {
        throw new Error("Automatización no encontrada");
      }

      const enabled = body.enabled !== undefined ? body.enabled : !existing.enabled;
      const automation = await services.automationRepository.toggleEnabled(params.id, enabled);

      return automation;
    },
    {
      body: t.Object({
        enabled: t.Optional(t.Boolean()),
      }),
    },
  )

  // ========================================
  // TRIGGERS
  // ========================================

  // Add trigger to automation
  .post(
    "/:id/triggers",
    async ({ params, body, set, services, ctx }) => {
      const automation = await services.automationRepository.findById(params.id);
      if (!automation) {
        throw new Error("Automatización no encontrada");
      }

      const trigger = await services.automationTriggerRepository.create({
        automationId: params.id,
        type: body.type,
        name: body.name,
        config: body.config,
        isActive: body.isActive !== false,
      });

      set.status = 201;
      return trigger;
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("event"), t.Literal("schedule"), t.Literal("condition")]),
        name: t.Optional(t.String()),
        config: t.Union([eventTriggerConfig, scheduleTriggerConfig, conditionTriggerConfig]),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )

  // Update trigger
  .patch(
    "/:id/triggers/:triggerId",
    async ({ params, body, services, ctx }) => {
      const trigger = await services.automationTriggerRepository.findById(params.triggerId);
      if (!trigger || trigger.automationId !== params.id) {
        throw new Error("Trigger no encontrado");
      }

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.config !== undefined) updateData.config = body.config;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      return services.automationTriggerRepository.update(params.triggerId, updateData);
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        config: t.Optional(t.Union([eventTriggerConfig, scheduleTriggerConfig, conditionTriggerConfig])),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )

  // Delete trigger
  .delete("/:id/triggers/:triggerId", async ({ params, services, ctx }) => {
    const trigger = await services.automationTriggerRepository.findById(params.triggerId);
    if (!trigger || trigger.automationId !== params.id) {
      throw new Error("Trigger no encontrado");
    }

    await services.automationTriggerRepository.delete(params.triggerId);
    return { success: true, message: "Trigger eliminado" };
  })

  // ========================================
  // ACTIONS
  // ========================================

  // Add action to automation
  .post(
    "/:id/actions",
    async ({ params, body, set, services, ctx }) => {
      const automation = await services.automationRepository.findById(params.id);
      if (!automation) {
        throw new Error("Automatización no encontrada");
      }

      // Get current max order if not provided
      let order = body.order;
      if (order === undefined) {
        const existingActions = await services.automationActionRepository.findByAutomationId(params.id);
        order = existingActions.length;
      }

      const action = await services.automationActionRepository.create({
        automationId: params.id,
        type: body.type,
        name: body.name,
        order: order,
        config: body.config,
        isActive: body.isActive !== false,
        timeoutSeconds: body.timeoutSeconds,
        continueOnError: body.continueOnError,
      });

      set.status = 201;
      return action;
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("whatsapp"), t.Literal("email"), t.Literal("update_record"), t.Literal("create_task")]),
        name: t.Optional(t.String()),
        order: t.Optional(t.Number()),
        config: t.Union([whatsappActionConfig, emailActionConfig, updateRecordActionConfig, createTaskActionConfig]),
        isActive: t.Optional(t.Boolean()),
        timeoutSeconds: t.Optional(t.Number()),
        continueOnError: t.Optional(t.Boolean()),
      }),
    },
  )

  // Update action
  .patch(
    "/:id/actions/:actionId",
    async ({ params, body, services, ctx }) => {
      const action = await services.automationActionRepository.findById(params.actionId);
      if (!action || action.automationId !== params.id) {
        throw new Error("Acción no encontrada");
      }

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.order !== undefined) updateData.order = body.order;
      if (body.config !== undefined) updateData.config = body.config;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.timeoutSeconds !== undefined) updateData.timeoutSeconds = body.timeoutSeconds;
      if (body.continueOnError !== undefined) updateData.continueOnError = body.continueOnError;

      return services.automationActionRepository.update(params.actionId, updateData);
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        order: t.Optional(t.Number()),
        config: t.Optional(t.Union([whatsappActionConfig, emailActionConfig, updateRecordActionConfig, createTaskActionConfig])),
        isActive: t.Optional(t.Boolean()),
        timeoutSeconds: t.Optional(t.Number()),
        continueOnError: t.Optional(t.Boolean()),
      }),
    },
  )

  // Delete action
  .delete("/:id/actions/:actionId", async ({ params, services, ctx }) => {
    const action = await services.automationActionRepository.findById(params.actionId);
    if (!action || action.automationId !== params.id) {
      throw new Error("Acción no encontrada");
    }

    await services.automationActionRepository.delete(params.actionId);
    return { success: true, message: "Acción eliminada" };
  })

  // ========================================
  // EXECUTION LOGS
  // ========================================

  // Get execution logs for an automation
  .get("/:id/logs", async ({ params, query, services, ctx }) => {
    const automation = await services.automationRepository.findById(params.id);
    if (!automation) {
      throw new Error("Automatización no encontrada");
    }

    return services.automationExecutionLogRepository.findByAutomationId(params.id, {
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
    });
  })

  // Get execution log by ID
  .get("/:id/logs/:logId", async ({ params, services, ctx }) => {
    const log = await services.automationExecutionLogRepository.findById(params.logId);
    if (!log || log.automationId !== params.id) {
      throw new Error("Log de ejecución no encontrado");
    }

    return log;
  })

  // Get execution statistics for an automation
  .get("/:id/stats", async ({ params, services, ctx }) => {
    const automation = await services.automationRepository.findById(params.id);
    if (!automation) {
      throw new Error("Automatización no encontrada");
    }

    return services.automationExecutionLogRepository.getStatsByAutomationId(params.id);
  })

  // ========================================
  // MANUAL EXECUTION
  // ========================================

  // Manually trigger an automation
  .post(
    "/:id/execute",
    async ({ params, body, services, ctx }) => {
      const automation = await services.automationRepository.findById(params.id);
      if (!automation) {
        throw new Error("Automatización no encontrada");
      }

      if (!automation.enabled) {
        throw new Error("La automatización está deshabilitada");
      }

      // Get active triggers and actions
      const triggers = await services.automationTriggerRepository.findActiveByAutomationId(params.id);
      const actions = await services.automationActionRepository.findActiveByAutomationId(params.id);

      if (triggers.length === 0) {
        throw new Error("No hay triggers activos para esta automatización");
      }

      if (actions.length === 0) {
        throw new Error("No hay acciones activas para esta automatización");
      }

      // Create execution log
      const triggerData = body.triggerData || {};
      const executionLog = await services.automationExecutionLogRepository.create({
        automationId: params.id,
        triggerType: "manual",
        triggerData,
        status: "running",
      });

      // Mark as started
      await services.automationExecutionLogRepository.markStarted(executionLog.id);

      const actionsExecuted: any[] = [];
      let hasErrors = false;

      // Execute each action
      for (const action of actions) {
        try {
          let result: any;
          
          switch (action.type) {
            case "whatsapp":
              result = await services.automationService.executeWhatsAppAction(
                action.config as any,
                triggerData,
                automation.profileId
              );
              break;
            case "email":
              result = await services.automationService.executeEmailAction(
                action.config as any,
                triggerData,
                automation.profileId
              );
              break;
            case "update_record":
              result = await services.automationService.executeUpdateRecordAction(
                action.config as any,
                triggerData
              );
              break;
            case "create_task":
              result = await services.automationService.executeCreateTaskAction(
                action.config as any,
                triggerData,
                automation.profileId
              );
              break;
          }

          actionsExecuted.push({
            actionId: action.id,
            actionName: action.name,
            actionType: action.type,
            success: result.success,
            result: result.result,
            error: result.error,
          });

          if (!result.success && !action.continueOnError) {
            hasErrors = true;
            break;
          }
        } catch (error) {
          actionsExecuted.push({
            actionId: action.id,
            actionName: action.name,
            actionType: action.type,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          if (!action.continueOnError) {
            hasErrors = true;
            break;
          }
        }
      }

      // Mark execution as completed
      const finalStatus = hasErrors ? "partial" as const : "success" as const;
      const finalLog = await services.automationExecutionLogRepository.markCompleted(
        executionLog.id,
        finalStatus,
        actionsExecuted,
        { message: `Ejecutado manualmente` }
      );

      return {
        executionId: executionLog.id,
        status: finalStatus,
        actionsExecuted,
        log: finalLog,
      };
    },
    {
      body: t.Object({
        triggerData: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    },
  )

  // ========================================
  // GLOBAL ANALYTICS (across all automations)
  // ========================================

  // Get global automation analytics for a profile
  .get("/analytics/stats", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId = profileId;

    if (!targetProfileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return {
          totalExecutions: 0,
          successCount: 0,
          failedCount: 0,
          partialCount: 0,
          pendingCount: 0,
          runningCount: 0,
          successRate: 0,
          failureRate: 0,
          averageDuration: 0,
        };
      }
      targetProfileId = profiles[0].id;
    }

    return services.automationExecutionLogRepository.getGlobalStats(targetProfileId);
  })

  // Get most used automations
  .get("/analytics/most-used", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    const limit = query.limit ? parseInt(query.limit as string) : 10;
    let targetProfileId = profileId;

    if (!targetProfileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    }

    return services.automationExecutionLogRepository.getMostUsedAutomations(targetProfileId, limit);
  })

  // Get execution trends over time
  .get("/analytics/trends", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    const days = query.days ? parseInt(query.days as string) : 30;
    let targetProfileId = profileId;

    if (!targetProfileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    }

    return services.automationExecutionLogRepository.getExecutionTrend(targetProfileId, days);
  })

  // Get global execution logs for all automations
  .get("/analytics/logs", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId = profileId;

    if (!targetProfileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    }

    return services.automationExecutionLogRepository.findByProfileId(targetProfileId, {
      limit: query.limit ? parseInt(query.limit as string) : 50,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      status: query.status as string,
      automationId: query.automationId as string,
    });
  });
