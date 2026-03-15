import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useAutomation,
  useAutomationLogs,
  useAutomationStats,
  useExecuteAutomation,
  type AutomationExecutionLog,
} from "@/hooks/use-automations";
import { Loader2, Play, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Status labels and colors
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  running: { label: "Ejecutando", color: "bg-blue-500", icon: <RefreshCw className="h-4 w-4" /> },
  success: { label: "Exitoso", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  partial: { label: "Parcial", color: "bg-orange-500", icon: <AlertCircle className="h-4 w-4" /> },
  failed: { label: "Fallido", color: "bg-red-500", icon: <XCircle className="h-4 w-4" /> },
};

export function AutomationLogsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useProfile();

  const { data: automation, isLoading: isLoadingAutomation } = useAutomation(id || "");
  const { data: logs, isLoading: isLoadingLogs, refetch } = useAutomationLogs(id || "");
  const { data: stats, isLoading: isLoadingStats } = useAutomationStats(id || "");
  const { mutate: executeAutomation, isPending: isExecuting } = useExecuteAutomation();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AutomationExecutionLog | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // Filter logs
  const filteredLogs = (logs || []).filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      JSON.stringify(log.triggerData).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle manual execution
  const handleExecute = () => {
    if (!id) return;

    executeAutomation(
      { automationId: id },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  // Open log details
  const openLogDetails = (log: AutomationExecutionLog) => {
    setSelectedLog(log);
    setLogDialogOpen(true);
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

  // Format duration
  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return "En curso";
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}min`;
  };

  if (isLoadingAutomation || isLoadingLogs || isLoadingStats) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/automations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs de Ejecución</h1>
            <p className="text-muted-foreground">
              {automation?.name || "Automatización"}
            </p>
          </div>
        </div>
        <Button onClick={handleExecute} disabled={isExecuting || !automation?.enabled}>
          {isExecuting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Ejecutar Ahora
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats?.totalExecutions || 0}</p>
              <p className="text-sm text-muted-foreground">Total Ejecuciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {stats?.successCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">Exitosas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {stats?.partialCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">Parciales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {stats?.failedCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">Fallidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === "success" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("success")}
          >
            Exitosas
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
          >
            Fallidas
          </Button>
          <Button
            variant={statusFilter === "running" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("running")}
          >
            En Curso
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay logs de ejecución</h3>
            <p className="text-muted-foreground text-center">
              Los logs de ejecución aparecerán aquí cuando se ejecute la automatización
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tipo de Trigger</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => openLogDetails(log)}
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig[log.status]?.color} text-white`}
                      >
                        {statusConfig[log.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{log.triggerType}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.startedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(log.startedAt, log.completedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Log Details Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Ejecución</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.startedAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Estado:</span>
                <Badge
                  variant="outline"
                  className={`${statusConfig[selectedLog.status]?.color} text-white`}
                >
                  {statusConfig[selectedLog.status]?.label}
                </Badge>
              </div>

              {/* Trigger Type */}
              <div>
                <span className="font-semibold">Tipo de Trigger:</span>{" "}
                <span className="capitalize">{selectedLog.triggerType}</span>
              </div>

              {/* Trigger Data */}
              {Object.keys(selectedLog.triggerData || {}).length > 0 && (
                <div>
                  <span className="font-semibold">Datos del Trigger:</span>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(selectedLog.triggerData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div>
                  <span className="font-semibold text-red-600">Error:</span>
                  <p className="mt-1 text-red-500">{selectedLog.errorMessage}</p>
                </div>
              )}

              {/* Actions Executed */}
              <div>
                <span className="font-semibold">Acciones Ejecutadas:</span>
                <div className="mt-2 space-y-2">
                  {(selectedLog.actionsExecuted || []).map((action, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        action.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {action.actionName || action.actionType}
                        </span>
                        {action.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      {action.error && (
                        <p className="text-sm text-red-600 mt-1">{action.error}</p>
                      )}
                      {action.result && (
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(action.result, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Inicio:</span>{" "}
                  {formatDate(selectedLog.startedAt)}
                </div>
                <div>
                  <span className="font-semibold">Fin:</span>{" "}
                  {selectedLog.completedAt
                    ? formatDate(selectedLog.completedAt)
                    : "En curso"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
