import { useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useGlobalAutomationStats,
  useMostUsedAutomations,
  useExecutionTrends,
  useGlobalAutomationLogs,
  useProfileAutomations,
  type GlobalExecutionLog,
} from "@/hooks/use-automations";
import { Loader2, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Search, Filter, TrendingUp, BarChart3 } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Status labels and colors
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  running: { label: "Ejecutando", color: "bg-blue-500", icon: <RefreshCw className="h-4 w-4" /> },
  success: { label: "Exitoso", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  partial: { label: "Parcial", color: "bg-orange-500", icon: <AlertCircle className="h-4 w-4" /> },
  failed: { label: "Fallido", color: "bg-red-500", icon: <XCircle className="h-4 w-4" /> },
};

export function AutomationAnalyticsPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  // Fetch analytics data
  const { data: stats, isLoading: isLoadingStats } = useGlobalAutomationStats(profileId);
  const { data: mostUsed, isLoading: isLoadingMostUsed } = useMostUsedAutomations(profileId, 10);
  const { data: trends, isLoading: isLoadingTrends } = useExecutionTrends(profileId, 30);
  const { data: logs, isLoading: isLoadingLogs, refetch } = useGlobalAutomationLogs(profileId, { limit: 50 });
  const { data: automations } = useProfileAutomations(profileId);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [automationFilter, setAutomationFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<GlobalExecutionLog | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [daysFilter, setDaysFilter] = useState<number>(30);

  // Filter logs
  const filteredLogs = (logs || []).filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.automation?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesAutomation = automationFilter === "all" || log.automationId === automationFilter;

    return matchesSearch && matchesStatus && matchesAutomation;
  });

  // Open log details
  const openLogDetails = (log: GlobalExecutionLog) => {
    setSelectedLog(log);
    setLogDialogOpen(true);
  };

  // Navigate to automation details
  const navigateToAutomation = (automationId: string) => {
    navigate(`/dashboard/automations/${automationId}/logs`);
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

  // Calculate trend data for chart
  const getTrendChartData = () => {
    if (!trends || trends.length === 0) return [];
    
    return trends.map((t) => ({
      date: new Date(t.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
      total: t.total,
      success: t.success,
      failed: t.failed,
    }));
  };

  const chartData = getTrendChartData();
  const maxValue = Math.max(...chartData.map((d) => d.total), 1);

  if (isLoadingStats) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análisis de Automatizaciones</h1>
            <p className="text-muted-foreground">
              Métricas y estadísticas de todas tus automatizaciones
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/automations")}>
          Ver Automatizaciones
        </Button>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {stats?.successRate || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="logs">Historial de Ejecuciones</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Used Automations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Automatizaciones Más Usadas
                </CardTitle>
                <CardDescription>
                  Ranking de automatizaciones por número de ejecuciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMostUsed ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mostUsed && mostUsed.length > 0 ? (
                  <div className="space-y-3">
                    {mostUsed.map((item, index) => (
                      <div
                        key={item.automationId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigateToAutomation(item.automationId)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{item.automationName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.executionCount} ejecuciones
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {item.successCount} ✓
                          </Badge>
                          {item.failureCount > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {item.failureCount} ✕
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de ejecuciones</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas Rápidas
                </CardTitle>
                <CardDescription>
                  Resumen del rendimiento de tus automatizaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Promedio de Duración</p>
                    <p className="text-2xl font-bold">
                      {stats?.averageDuration ? 
                        (stats.averageDuration < 1000 ? `${stats.averageDuration}ms` :
                        stats.averageDuration < 60000 ? `${(stats.averageDuration / 1000).toFixed(1)}s` :
                        `${(stats.averageDuration / 60000).toFixed(1)}min`) : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Tasa de Fallos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats?.failureRate || 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">En Cola</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats?.pendingCount || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">En Ejecución</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.runningCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Ejecución</CardTitle>
              <CardDescription>
                Número de ejecuciones a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(Number(v))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="14">Últimos 14 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="60">Últimos 60 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoadingTrends ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="space-y-4">
                  {/* Chart */}
                  <div className="h-64 flex items-end gap-1">
                    {chartData.map((day, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${day.date}: ${day.total} ejecuciones`}
                      >
                        <div
                          className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                          style={{
                            height: `${Math.max((day.total / maxValue) * 200, 4)}px`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground transform -rotate-45 origin-center whitespace-nowrap">
                          {day.date}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-sm text-muted-foreground">Exitosas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span className="text-sm text-muted-foreground">Fallidas</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{chartData.reduce((a, b) => a + b.total, 0)}</p>
                      <p className="text-sm text-muted-foreground">Total Período</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {chartData.reduce((a, b) => a + b.success, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Exitosas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {chartData.reduce((a, b) => a + b.failed, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Fallidas</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de tendencias disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="success">Exitosas</SelectItem>
                  <SelectItem value="failed">Fallidas</SelectItem>
                  <SelectItem value="running">En Curso</SelectItem>
                  <SelectItem value="partial">Parciales</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={automationFilter} onValueChange={setAutomationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Automatización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las automatizaciones</SelectItem>
                  {automations?.map((auto) => (
                    <SelectItem key={auto.id} value={auto.id}>
                      {auto.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          {isLoadingLogs ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay logs de ejecución</h3>
                <p className="text-muted-foreground text-center">
                  Los logs de ejecución aparecerán aquí cuando se ejecuten las automatizaciones
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Automatización</TableHead>
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
                          <span className="font-medium">{log.automation?.name || "Desconocida"}</span>
                        </TableCell>
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
        </TabsContent>
      </Tabs>

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
              {/* Automation Name */}
              <div>
                <span className="font-semibold">Automatización:</span>{" "}
                <span className="font-medium">{selectedLog.automation?.name || "Desconocida"}</span>
              </div>

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
