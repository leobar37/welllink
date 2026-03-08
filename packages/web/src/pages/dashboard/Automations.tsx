import { useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useAutomations,
  useToggleAutomation,
  useDeleteAutomation,
  type Automation,
} from "@/hooks/use-automations";
import { Loader2, Plus, Zap, Pencil, Trash2, Play, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Trigger type labels
const triggerTypeLabels: Record<string, string> = {
  event: "Evento",
  schedule: "Programado",
  condition: "Condición",
};

// Action type labels
const actionTypeLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  update_record: "Actualizar Registro",
  create_task: "Crear Tarea",
};

export function AutomationsPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { data: automations, isLoading, refetch } = useAutomations(profileId);
  const { mutate: toggleAutomation, isPending: isToggling } = useToggleAutomation();
  const { mutate: deleteAutomation, isPending: isDeleting } = useDeleteAutomation();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);

  // Filter automations
  const filteredAutomations = (automations || []).filter((automation) => {
    const matchesSearch =
      searchTerm === "" ||
      automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (automation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesEnabled =
      enabledFilter === "all" ||
      (enabledFilter === "enabled" && automation.enabled) ||
      (enabledFilter === "disabled" && !automation.enabled);

    return matchesSearch && matchesEnabled;
  });

  // Handle toggle
  const handleToggle = (automation: Automation) => {
    toggleAutomation(
      { id: automation.id, enabled: !automation.enabled },
      {
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!automationToDelete) return;

    deleteAutomation(automationToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setAutomationToDelete(null);
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    });
  };

  // Open delete dialog
  const openDeleteDialog = (automation: Automation) => {
    setAutomationToDelete(automation);
    setDeleteDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus automatizaciones para optimizar tu negocio
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/automations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Automatización
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar automatizaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={enabledFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabledFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={enabledFilter === "enabled" ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabledFilter("enabled")}
          >
            Activas
          </Button>
          <Button
            variant={enabledFilter === "disabled" ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabledFilter("disabled")}
          >
            Inactivas
          </Button>
        </div>
      </div>

      {/* Automations List */}
      {filteredAutomations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay automatizaciones</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primera automatización para comenzar a optimizar tu negocio
            </p>
            <Button onClick={() => navigate("/dashboard/automations/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Automatización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Última actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAutomations.map((automation) => (
                  <TableRow key={automation.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span>{automation.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.enabled}
                          onCheckedChange={() => handleToggle(automation)}
                          disabled={isToggling}
                        />
                        <Label className="text-sm">
                          {automation.enabled ? "Activa" : "Inactiva"}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {automation.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(automation.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/dashboard/automations/${automation.id}/execute`)
                          }
                          title="Ejecutar"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/dashboard/automations/${automation.id}`)
                          }
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/dashboard/automations/${automation.id}/logs`)
                          }
                          title="Ver Logs"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(automation)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Automatización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la automatización "
              {automationToDelete?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
