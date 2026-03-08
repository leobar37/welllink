import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useAutomation,
  useCreateAutomation,
  useUpdateAutomation,
  useAddTrigger,
  useUpdateTrigger,
  useDeleteTrigger,
  useAddAction,
  useUpdateAction,
  useDeleteAction,
  type AutomationWithDetails,
  type AutomationTrigger,
  type AutomationAction,
  type EventTriggerConfig,
  type ScheduleTriggerConfig,
  type ConditionTriggerConfig,
  type WhatsAppActionConfig,
  type EmailActionConfig,
  type UpdateRecordActionConfig,
  type CreateTaskActionConfig,
} from "@/hooks/use-automations";
import { Loader2, Plus, Trash2, Save, ArrowLeft, ArrowRight, GripVertical, Zap, Bell, CheckCircle, Edit3, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Event types
const EVENT_TYPES = [
  { value: "appointment.created", label: "Cita creada" },
  { value: "appointment.completed", label: "Cita completada" },
  { value: "appointment.cancelled", label: "Cita cancelada" },
  { value: "client.created", label: "Cliente creado" },
  { value: "client.updated", label: "Cliente actualizado" },
  { value: "service.completed", label: "Servicio completado" },
  { value: "stock.low", label: "Stock bajo" },
  { value: "stock.out", label: "Sin stock" },
];

// Operators for conditions
const OPERATORS = [
  { value: "eq", label: "Igual a" },
  { value: "neq", label: "Diferente de" },
  { value: "gt", label: "Mayor que" },
  { value: "gte", label: "Mayor o igual que" },
  { value: "lt", label: "Menor que" },
  { value: "lte", label: "Menor o igual que" },
  { value: "contains", label: "Contiene" },
  { value: "in", label: "Está en" },
  { value: "is_null", label: "Es nulo" },
];

// Entity types for conditions
const ENTITY_TYPES = [
  { value: "appointment", label: "Cita" },
  { value: "client", label: "Cliente" },
  { value: "product", label: "Producto" },
  { value: "inventory", label: "Inventario" },
];

// Trigger type labels
const triggerTypeLabels: Record<string, string> = {
  event: "Evento",
  schedule: "Programado",
  condition: "Condición",
};

// Action type labels and icons
const actionTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  whatsapp: { label: "WhatsApp", icon: <Bell className="h-4 w-4" /> },
  email: { label: "Email", icon: <Edit3 className="h-4 w-4" /> },
  update_record: { label: "Actualizar Registro", icon: <CheckCircle className="h-4 w-4" /> },
  create_task: { label: "Crear Tarea", icon: <Clock className="h-4 w-4" /> },
};

// Initial trigger config
const initialEventTriggerConfig: EventTriggerConfig = {
  eventType: "appointment.created",
  filters: {},
};

const initialScheduleTriggerConfig: ScheduleTriggerConfig = {
  cronExpression: "0 9 * * *", // Daily at 9am
  timezone: "America/Mexico_City",
};

const initialConditionTriggerConfig: ConditionTriggerConfig = {
  entityType: "appointment",
  conditions: [],
  logicalOperator: "AND",
  pollInterval: 15,
};

// Initial action configs
const initialWhatsAppConfig: WhatsAppActionConfig = {
  recipientType: "client",
  message: "",
};

const initialEmailConfig: EmailActionConfig = {
  recipientType: "client",
  subject: "",
  body: "",
};

const initialUpdateRecordConfig: UpdateRecordActionConfig = {
  entityType: "appointment",
  entityIdType: "variable",
  entityIdVariablePath: "appointment.id",
  updates: {},
};

const initialCreateTaskConfig: CreateTaskActionConfig = {
  title: "",
  description: "",
  assignToType: "owner",
  dueDateType: "relative",
  relativeDueDate: "+1d",
  priority: "normal",
};

export function AutomationBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useProfile();
  const profileId = profile?.id || "";
  const isNew = id === "new";

  // Fetch existing automation if editing
  const { data: existingAutomation, isLoading: isLoadingAutomation } = useAutomation(id || "");
  const { mutate: createAutomation, isPending: isCreating } = useCreateAutomation();
  const { mutate: updateAutomation, isPending: isUpdating } = useUpdateAutomation();

  // Trigger mutations
  const { mutate: addTrigger, isPending: isAddingTrigger } = useAddTrigger();
  const { mutate: updateTrigger, isPending: isUpdatingTrigger } = useUpdateTrigger();
  const { mutate: deleteTrigger, isPending: isDeletingTrigger } = useDeleteTrigger();

  // Action mutations
  const { mutate: addAction, isPending: isAddingAction } = useAddAction();
  const { mutate: updateAction, isPending: isUpdatingAction } = useUpdateAction();
  const { mutate: deleteAction, isPending: isDeletingAction } = useDeleteAction();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState("normal");

  // Triggers
  const [triggers, setTriggers] = useState<AutomationTrigger[]>([]);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [triggerType, setTriggerType] = useState<"event" | "schedule" | "condition">("event");
  const [triggerName, setTriggerName] = useState("");
  const [eventConfig, setEventConfig] = useState<EventTriggerConfig>(initialEventTriggerConfig);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleTriggerConfig>(initialScheduleTriggerConfig);
  const [conditionConfig, setConditionConfig] = useState<ConditionTriggerConfig>(initialConditionTriggerConfig);

  // Actions
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<AutomationAction | null>(null);
  const [actionType, setActionType] = useState<"whatsapp" | "email" | "update_record" | "create_task">("whatsapp");
  const [actionName, setActionName] = useState("");
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppActionConfig>(initialWhatsAppConfig);
  const [emailConfig, setEmailConfig] = useState<EmailActionConfig>(initialEmailConfig);
  const [updateRecordConfig, setUpdateRecordConfig] = useState<UpdateRecordActionConfig>(initialUpdateRecordConfig);
  const [createTaskConfig, setCreateTaskConfig] = useState<CreateTaskActionConfig>(initialCreateTaskConfig);

  // Load existing automation data
  useEffect(() => {
    if (existingAutomation) {
      setName(existingAutomation.name);
      setDescription(existingAutomation.description || "");
      setEnabled(existingAutomation.enabled);
      setPriority(existingAutomation.priority);
      setTriggers(existingAutomation.triggers || []);
      setActions(existingAutomation.actions || []);
    }
  }, [existingAutomation]);

  // Save automation
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (triggers.length === 0) {
      toast.error("Debes añadir al menos un trigger");
      return;
    }

    if (actions.length === 0) {
      toast.error("Debes añadir al menos una acción");
      return;
    }

    const automationData = {
      name,
      description: description || undefined,
      enabled,
      priority,
      triggers: triggers.map((t) => ({
        type: t.type,
        name: t.name || undefined,
        config: t.config,
        isActive: t.isActive,
      })),
      actions: actions.map((a, index) => ({
        type: a.type,
        name: a.name || undefined,
        order: index,
        config: a.config,
        isActive: a.isActive,
        timeoutSeconds: a.timeoutSeconds,
        continueOnError: a.continueOnError,
      })),
    };

    if (isNew) {
      createAutomation(automationData, {
        onSuccess: (data) => {
          toast.success("Automatización creada correctamente");
          navigate(`/dashboard/automations/${data?.id}`);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      });
    } else {
      updateAutomation(
        { id: id!, ...automationData },
        {
          onSuccess: () => {
            toast.success("Automatización actualizada correctamente");
          },
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }
      );
    }
  };

  // Add/Update trigger
  const handleSaveTrigger = () => {
    if (!isNew && id) {
      // For existing automations, save directly
      const triggerData = {
        automationId: id,
        type: triggerType,
        name: triggerName || undefined,
        config:
          triggerType === "event"
            ? eventConfig
            : triggerType === "schedule"
            ? scheduleConfig
            : conditionConfig,
        isActive: true,
      };

      if (editingTrigger) {
        updateTrigger(
          {
            automationId: id,
            triggerId: editingTrigger.id,
            name: triggerName || undefined,
            config: triggerData.config,
          },
          {
            onSuccess: () => {
              setTriggerDialogOpen(false);
              setEditingTrigger(null);
            },
          }
        );
      } else {
        addTrigger(triggerData, {
          onSuccess: () => {
            setTriggerDialogOpen(false);
          },
        });
      }
    } else {
      // For new automations, just update local state
      const newTrigger: AutomationTrigger = {
        id: editingTrigger?.id || crypto.randomUUID(),
        automationId: id || "",
        type: triggerType,
        name: triggerName || null,
        config:
          triggerType === "event"
            ? eventConfig
            : triggerType === "schedule"
            ? scheduleConfig
            : conditionConfig,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingTrigger) {
        setTriggers(triggers.map((t) => (t.id === editingTrigger.id ? newTrigger : t)));
      } else {
        setTriggers([...triggers, newTrigger]);
      }
      setTriggerDialogOpen(false);
      setEditingTrigger(null);
    }
  };

  // Delete trigger
  const handleDeleteTrigger = (triggerId: string) => {
    if (!isNew && id) {
      deleteTrigger(
        { automationId: id, triggerId },
        {
          onSuccess: () => {},
        }
      );
    } else {
      setTriggers(triggers.filter((t) => t.id !== triggerId));
    }
  };

  // Add/Update action
  const handleSaveAction = () => {
    const actionConfig =
      actionType === "whatsapp"
        ? whatsappConfig
        : actionType === "email"
        ? emailConfig
        : actionType === "update_record"
        ? updateRecordConfig
        : createTaskConfig;

    if (!isNew && id) {
      const actionData = {
        automationId: id,
        type: actionType,
        name: actionName || undefined,
        config: actionConfig,
        isActive: true,
      };

      if (editingAction) {
        updateAction(
          {
            automationId: id,
            actionId: editingAction.id,
            name: actionName || undefined,
            config: actionConfig,
          },
          {
            onSuccess: () => {
              setActionDialogOpen(false);
              setEditingAction(null);
            },
          }
        );
      } else {
        addAction(actionData, {
          onSuccess: () => {
            setActionDialogOpen(false);
          },
        });
      }
    } else {
      // For new automations, just update local state
      const newAction: AutomationAction = {
        id: editingAction?.id || crypto.randomUUID(),
        automationId: id || "",
        type: actionType,
        name: actionName || null,
        order: editingAction ? editingAction.order : actions.length,
        config: actionConfig,
        isActive: true,
        timeoutSeconds: 30,
        continueOnError: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingAction) {
        setActions(actions.map((a) => (a.id === editingAction.id ? newAction : a)));
      } else {
        setActions([...actions, newAction]);
      }
      setActionDialogOpen(false);
      setEditingAction(null);
    }
  };

  // Delete action
  const handleDeleteAction = (actionId: string) => {
    if (!isNew && id) {
      deleteAction(
        { automationId: id, actionId },
        {
          onSuccess: () => {},
        }
      );
    } else {
      setActions(actions.filter((a) => a.id !== actionId));
    }
  };

  // Open trigger dialog
  const openTriggerDialog = (trigger?: AutomationTrigger) => {
    if (trigger) {
      setEditingTrigger(trigger);
      setTriggerType(trigger.type);
      setTriggerName(trigger.name || "");
      if (trigger.type === "event") {
        setEventConfig(trigger.config as EventTriggerConfig);
      } else if (trigger.type === "schedule") {
        setScheduleConfig(trigger.config as ScheduleTriggerConfig);
      } else {
        setConditionConfig(trigger.config as ConditionTriggerConfig);
      }
    } else {
      setEditingTrigger(null);
      setTriggerType("event");
      setTriggerName("");
      setEventConfig(initialEventTriggerConfig);
      setScheduleConfig(initialScheduleTriggerConfig);
      setConditionConfig(initialConditionTriggerConfig);
    }
    setTriggerDialogOpen(true);
  };

  // Open action dialog
  const openActionDialog = (action?: AutomationAction) => {
    if (action) {
      setEditingAction(action);
      setActionType(action.type);
      setActionName(action.name || "");
      if (action.type === "whatsapp") {
        setWhatsappConfig(action.config as WhatsAppActionConfig);
      } else if (action.type === "email") {
        setEmailConfig(action.config as EmailActionConfig);
      } else if (action.type === "update_record") {
        setUpdateRecordConfig(action.config as UpdateRecordActionConfig);
      } else {
        setCreateTaskConfig(action.config as CreateTaskActionConfig);
      }
    } else {
      setEditingAction(null);
      setActionType("whatsapp");
      setActionName("");
      setWhatsappConfig(initialWhatsAppConfig);
      setEmailConfig(initialEmailConfig);
      setUpdateRecordConfig(initialUpdateRecordConfig);
      setCreateTaskConfig(initialCreateTaskConfig);
    }
    setActionDialogOpen(true);
  };

  if (isLoadingAutomation) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = isCreating || isUpdating || isAddingTrigger || isUpdatingTrigger || isDeletingTrigger || isAddingAction || isUpdatingAction || isDeletingAction;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/automations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Nueva Automatización" : "Editar Automatización"}
            </h1>
            <p className="text-muted-foreground">
              Configura los triggers y acciones de tu automatización
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>{enabled ? "Activa" : "Inactiva"}</Label>
          </div>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la automatización"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué hace esta automatización"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Flow Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Triggers Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Triggers
                </CardTitle>
                <CardDescription>
                  Define cuándo se ejecutará la automatización
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => openTriggerDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Trigger
              </Button>
            </CardHeader>
            <CardContent>
              {triggers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay triggers configurados</p>
                  <p className="text-sm">Añade un trigger para definir cuándo se ejecuta</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {triggers.map((trigger, index) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {trigger.name || triggerTypeLabels[trigger.type]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trigger.type === "event" && (trigger.config as EventTriggerConfig).eventType}
                            {trigger.type === "schedule" && (trigger.config as ScheduleTriggerConfig).cronExpression}
                            {trigger.type === "condition" && `Condición: ${(trigger.config as ConditionTriggerConfig).entityType}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTriggerDialog(trigger)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTrigger(trigger.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Acciones
                </CardTitle>
                <CardDescription>
                  Define qué sucede cuando se activa el trigger
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => openActionDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Acción
              </Button>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay acciones configuradas</p>
                  <p className="text-sm">Añade una acción para definir qué sucede</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions
                    .sort((a, b) => a.order - b.order)
                    .map((action, index) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {index > 0 && <ArrowUp className="h-3 w-3 text-muted-foreground" />}
                            <Badge variant="outline">{index + 1}</Badge>
                            {index < actions.length - 1 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {actionTypeConfig[action.type]?.icon}
                              {action.name || actionTypeConfig[action.type]?.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {action.type === "whatsapp" && (action.config as WhatsAppActionConfig).message?.substring(0, 50)}
                              {action.type === "email" && (action.config as EmailActionConfig).subject}
                              {action.type === "update_record" && `Actualizar: ${(action.config as UpdateRecordActionConfig).entityType}`}
                              {action.type === "create_task" && (action.config as CreateTaskActionConfig).title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openActionDialog(action)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAction(action.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trigger Dialog */}
      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTrigger ? "Editar Trigger" : "Añadir Trigger"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Trigger</Label>
              <Select
                value={triggerType}
                onValueChange={(v) => setTriggerType(v as "event" | "schedule" | "condition")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="schedule">Programado</SelectItem>
                  <SelectItem value="condition">Condición</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input
                value={triggerName}
                onChange={(e) => setTriggerName(e.target.value)}
                placeholder="Nombre descriptivo"
              />
            </div>

            {/* Event Trigger Config */}
            {triggerType === "event" && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Evento</Label>
                  <Select
                    value={eventConfig.eventType}
                    onValueChange={(v) => setEventConfig({ ...eventConfig, eventType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Schedule Trigger Config */}
            {triggerType === "schedule" && (
              <div className="space-y-4">
                <div>
                  <Label>Expresión Cron</Label>
                  <Input
                    value={scheduleConfig.cronExpression}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, cronExpression: e.target.value })}
                    placeholder="0 9 * * *"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Formato: minuto hora día mes día_semana
                  </p>
                </div>
                <div>
                  <Label>Zona Horaria</Label>
                  <Input
                    value={scheduleConfig.timezone || ""}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, timezone: e.target.value })}
                    placeholder="America/Mexico_City"
                  />
                </div>
              </div>
            )}

            {/* Condition Trigger Config */}
            {triggerType === "condition" && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Entidad</Label>
                  <Select
                    value={conditionConfig.entityType}
                    onValueChange={(v) => setConditionConfig({ ...conditionConfig, entityType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operador Lógico</Label>
                  <Select
                    value={conditionConfig.logicalOperator || "AND"}
                    onValueChange={(v) => setConditionConfig({ ...conditionConfig, logicalOperator: v as "AND" | "OR" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND (Todas las condiciones)</SelectItem>
                      <SelectItem value="OR">OR (Cualquier condición)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTrigger}>
              {editingTrigger ? "Actualizar" : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? "Editar Acción" : "Añadir Acción"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Acción</Label>
              <Select
                value={actionType}
                onValueChange={(v) => setActionType(v as "whatsapp" | "email" | "update_record" | "create_task")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="update_record">Actualizar Registro</SelectItem>
                  <SelectItem value="create_task">Crear Tarea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="Nombre descriptivo"
              />
            </div>

            {/* WhatsApp Action Config */}
            {actionType === "whatsapp" && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Destinatario</Label>
                  <Select
                    value={whatsappConfig.recipientType}
                    onValueChange={(v) => setWhatsappConfig({ ...whatsappConfig, recipientType: v as "client" | "phone" | "variable" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="phone">Número de teléfono</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {whatsappConfig.recipientType === "phone" && (
                  <div>
                    <Label>Número de Teléfono</Label>
                    <Input
                      value={whatsappConfig.phoneNumber || ""}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                      placeholder="+52..."
                    />
                  </div>
                )}
                <div>
                  <Label>Mensaje</Label>
                  <Textarea
                    value={whatsappConfig.message}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, message: e.target.value })}
                    placeholder="Escribe tu mensaje..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Email Action Config */}
            {actionType === "email" && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Destinatario</Label>
                  <Select
                    value={emailConfig.recipientType}
                    onValueChange={(v) => setEmailConfig({ ...emailConfig, recipientType: v as "client" | "email" | "variable" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {emailConfig.recipientType === "email" && (
                  <div>
                    <Label>Dirección de Email</Label>
                    <Input
                      value={emailConfig.email || ""}
                      onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                )}
                <div>
                  <Label>Asunto</Label>
                  <Input
                    value={emailConfig.subject}
                    onChange={(e) => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                    placeholder="Asunto del email"
                  />
                </div>
                <div>
                  <Label>Cuerpo del Email</Label>
                  <Textarea
                    value={emailConfig.body}
                    onChange={(e) => setEmailConfig({ ...emailConfig, body: e.target.value })}
                    placeholder="Cuerpo del email (soporta HTML)..."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* Update Record Action Config */}
            {actionType === "update_record" && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Entidad</Label>
                  <Select
                    value={updateRecordConfig.entityType}
                    onValueChange={(v) => setUpdateRecordConfig({ ...updateRecordConfig, entityType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Create Task Action Config */}
            {actionType === "create_task" && (
              <div className="space-y-4">
                <div>
                  <Label>Título de la Tarea</Label>
                  <Input
                    value={createTaskConfig.title}
                    onChange={(e) => setCreateTaskConfig({ ...createTaskConfig, title: e.target.value })}
                    placeholder="Título de la tarea"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={createTaskConfig.description || ""}
                    onChange={(e) => setCreateTaskConfig({ ...createTaskConfig, description: e.target.value })}
                    placeholder="Descripción de la tarea"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Asignar a</Label>
                  <Select
                    value={createTaskConfig.assignToType}
                    onValueChange={(v) => setCreateTaskConfig({ ...createTaskConfig, assignToType: v as "staff" | "owner" | "variable" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Propietario</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={createTaskConfig.priority}
                    onValueChange={(v) => setCreateTaskConfig({ ...createTaskConfig, priority: v as "low" | "normal" | "high" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha de Vencimiento</Label>
                  <Select
                    value={createTaskConfig.dueDateType}
                    onValueChange={(v) => setCreateTaskConfig({ ...createTaskConfig, dueDateType: v as "relative" | "absolute" | "variable" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relative">Relativa (+1d, +1w)</SelectItem>
                      <SelectItem value="absolute">Absoluta (fecha)</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createTaskConfig.dueDateType === "relative" && (
                  <div>
                    <Label>Fecha Relativa</Label>
                    <Input
                      value={createTaskConfig.relativeDueDate || ""}
                      onChange={(e) => setCreateTaskConfig({ ...createTaskConfig, relativeDueDate: e.target.value })}
                      placeholder="+1d, +1w, +1M"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAction}>
              {editingAction ? "Actualizar" : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Arrow icons
function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
