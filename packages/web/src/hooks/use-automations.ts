import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// Types
export interface Automation {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationWithDetails extends Automation {
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
}

export interface AutomationTrigger {
  id: string;
  automationId: string;
  type: "event" | "schedule" | "condition";
  name: string | null;
  config: EventTriggerConfig | ScheduleTriggerConfig | ConditionTriggerConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventTriggerConfig {
  eventType: string;
  filters?: Record<string, unknown>;
}

export interface ScheduleTriggerConfig {
  cronExpression: string;
  timezone?: string;
  daysOfWeek?: number[];
  hours?: number[];
}

export interface ConditionTriggerConfig {
  entityType: string;
  conditions: {
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "is_null";
    value: unknown;
  }[];
  logicalOperator?: "AND" | "OR";
  pollInterval?: number;
}

export interface AutomationAction {
  id: string;
  automationId: string;
  type: "whatsapp" | "email" | "update_record" | "create_task";
  name: string | null;
  order: number;
  config: WhatsAppActionConfig | EmailActionConfig | UpdateRecordActionConfig | CreateTaskActionConfig;
  isActive: boolean;
  timeoutSeconds: number;
  continueOnError: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppActionConfig {
  recipientType: "client" | "phone" | "variable";
  phoneNumber?: string;
  clientId?: string;
  variablePath?: string;
  message: string;
  templateId?: string;
}

export interface EmailActionConfig {
  recipientType: "client" | "email" | "variable";
  email?: string;
  clientId?: string;
  variablePath?: string;
  subject: string;
  body: string;
  fromName?: string;
}

export interface UpdateRecordActionConfig {
  entityType: string;
  entityIdType: "fixed" | "variable";
  entityId?: string;
  entityIdVariablePath?: string;
  updates: Record<string, unknown>;
}

export interface CreateTaskActionConfig {
  title: string;
  description?: string;
  assignToType: "staff" | "owner" | "variable";
  staffId?: string;
  assignToVariablePath?: string;
  dueDateType: "relative" | "absolute" | "variable";
  relativeDueDate?: string;
  absoluteDueDate?: string;
  dueDateVariablePath?: string;
  priority: "low" | "normal" | "high";
}

export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  triggerType: string;
  triggerData: Record<string, unknown>;
  status: "pending" | "running" | "success" | "partial" | "failed";
  actionsExecuted: Array<{
    actionId: string;
    actionName: string | null;
    actionType: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
  errorMessage?: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface AutomationStats {
  totalExecutions: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  successRate: number;
  averageDuration: number;
}

// Hook for fetching automations list
export function useAutomations(profileId: string, enabled?: boolean) {
  return useQuery({
    queryKey: ["automations", profileId, enabled],
    queryFn: async () => {
      const { data, error } = await api.api.automations.get({
        profileId,
        enabled: enabled === undefined ? undefined : String(enabled),
      });
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return data || [];
    },
    enabled: !!profileId,
  });
}

// Hook for fetching a single automation with details
export function useAutomation(id: string) {
  return useQuery({
    queryKey: ["automation", id],
    queryFn: async () => {
      const { data, error } = await api.api.automations[":id"].get({ id });
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return data as AutomationWithDetails;
    },
    enabled: !!id,
  });
}

// Hook for creating an automation
export function useCreateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId?: string;
      name: string;
      description?: string;
      enabled?: boolean;
      priority?: string;
      triggers?: Array<{
        type: "event" | "schedule" | "condition";
        name?: string;
        config: EventTriggerConfig | ScheduleTriggerConfig | ConditionTriggerConfig;
        isActive?: boolean;
      }>;
      actions?: Array<{
        type: "whatsapp" | "email" | "update_record" | "create_task";
        name?: string;
        order?: number;
        config: WhatsAppActionConfig | EmailActionConfig | UpdateRecordActionConfig | CreateTaskActionConfig;
        isActive?: boolean;
        timeoutSeconds?: number;
        continueOnError?: boolean;
      }>;
    }) => {
      const { data: response, error } = await api.api.automations.post({}, data);
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automatización creada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for updating an automation
export function useUpdateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      enabled?: boolean;
      priority?: string;
    }) => {
      const { data: response, error } = await api.api.automations[":id"].patch(
        { id: data.id },
        {
          name: data.name,
          description: data.description,
          enabled: data.enabled,
          priority: data.priority,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automation", variables.id] });
      toast.success("Automatización actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for deleting an automation
export function useDeleteAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.api.automations[":id"].delete({ id });
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automatización eliminada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for toggling automation
export function useToggleAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; enabled: boolean }) => {
      const { data: response, error } = await api.api.automations[":id"].toggle.post(
        { id: data.id },
        { enabled: data.enabled }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automation", variables.id] });
      toast.success(variables.enabled ? "Automatización activada" : "Automatización desactivada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for adding a trigger
export function useAddTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      automationId: string;
      type: "event" | "schedule" | "condition";
      name?: string;
      config: EventTriggerConfig | ScheduleTriggerConfig | ConditionTriggerConfig;
      isActive?: boolean;
    }) => {
      const { data: response, error } = await api.api.automations[":id"].triggers.post(
        { id: data.automationId },
        {
          type: data.type,
          name: data.name,
          config: data.config,
          isActive: data.isActive,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Trigger añadido correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for updating a trigger
export function useUpdateTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      automationId: string;
      triggerId: string;
      name?: string;
      config?: EventTriggerConfig | ScheduleTriggerConfig | ConditionTriggerConfig;
      isActive?: boolean;
    }) => {
      const { data: response, error } = await api.api.automations[":id"].triggers[":triggerId"].patch(
        { id: data.automationId, triggerId: data.triggerId },
        {
          name: data.name,
          config: data.config,
          isActive: data.isActive,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Trigger actualizado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for deleting a trigger
export function useDeleteTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { automationId: string; triggerId: string }) => {
      const { data: response, error } = await api.api.automations[":id"].triggers[":triggerId"].delete(
        { id: data.automationId, triggerId: data.triggerId }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Trigger eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for adding an action
export function useAddAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      automationId: string;
      type: "whatsapp" | "email" | "update_record" | "create_task";
      name?: string;
      order?: number;
      config: WhatsAppActionConfig | EmailActionConfig | UpdateRecordActionConfig | CreateTaskActionConfig;
      isActive?: boolean;
      timeoutSeconds?: number;
      continueOnError?: boolean;
    }) => {
      const { data: response, error } = await api.api.automations[":id"].actions.post(
        { id: data.automationId },
        {
          type: data.type,
          name: data.name,
          order: data.order,
          config: data.config,
          isActive: data.isActive,
          timeoutSeconds: data.timeoutSeconds,
          continueOnError: data.continueOnError,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Acción añadida correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for updating an action
export function useUpdateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      automationId: string;
      actionId: string;
      name?: string;
      order?: number;
      config?: WhatsAppActionConfig | EmailActionConfig | UpdateRecordActionConfig | CreateTaskActionConfig;
      isActive?: boolean;
      timeoutSeconds?: number;
      continueOnError?: boolean;
    }) => {
      const { data: response, error } = await api.api.automations[":id"].actions[":actionId"].patch(
        { id: data.automationId, actionId: data.actionId },
        {
          name: data.name,
          order: data.order,
          config: data.config,
          isActive: data.isActive,
          timeoutSeconds: data.timeoutSeconds,
          continueOnError: data.continueOnError,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Acción actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for deleting an action
export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { automationId: string; actionId: string }) => {
      const { data: response, error } = await api.api.automations[":id"].actions[":actionId"].delete(
        { id: data.automationId, actionId: data.actionId }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation", variables.automationId] });
      toast.success("Acción eliminada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for fetching execution logs
export function useAutomationLogs(automationId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: ["automation-logs", automationId, limit, offset],
    queryFn: async () => {
      const { data, error } = await api.api.automations[":id"].logs.get({
        id: automationId,
        limit: limit?.toString(),
        offset: offset?.toString(),
      });
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return data || [];
    },
    enabled: !!automationId,
  });
}

// Hook for fetching automation stats
export function useAutomationStats(automationId: string) {
  return useQuery({
    queryKey: ["automation-stats", automationId],
    queryFn: async () => {
      const { data, error } = await api.api.automations[":id"].stats.get({ id: automationId });
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return data as AutomationStats;
    },
    enabled: !!automationId,
  });
}

// Hook for manually executing an automation
export function useExecuteAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { automationId: string; triggerData?: Record<string, unknown> }) => {
      const { data: response, error } = await api.api.automations[":id"].execute.post(
        { id: data.automationId },
        { triggerData: data.triggerData }
      );
      if (error) {
        throw new Error(extractErrorMessage(error));
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs", variables.automationId] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats", variables.automationId] });
      toast.success("Automatización ejecutada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
