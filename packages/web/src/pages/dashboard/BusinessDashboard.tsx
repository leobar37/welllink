import { useState } from "react";
import { Link } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import { useBusinessKPIs, useBusinessKPITrends } from "@/hooks/use-business-kpi";
import { useLowStockProducts } from "@/hooks/use-inventory";
import { 
  Loader2, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  UserPlus,
  RefreshCcw,
  AlertTriangle,
  Package,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-ES").format(value);
};

// Format percentage
const formatPercentage = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

// Get change color
const getChangeColor = (change: number) => {
  if (change > 0) return "text-green-600";
  if (change < 0) return "text-red-600";
  return "text-muted-foreground";
};

// Get industry label
const getIndustryLabel = (type: string) => {
  const labels: Record<string, string> = {
    beauty: "Belleza",
    health: "Salud",
    fitness: "Fitness",
    professional: "Profesional",
    technical: "Técnico",
  };
  return labels[type] || "General";
};

// Get KPI label for industry
const getKPILabel = (key: string) => {
  const labels: Record<string, string> = {
    occupancyRate: "Tasa de Ocupación",
    utilizationRate: "Tasa de Utilización",
    patientRetention: "Retención de Pacientes",
    treatmentCompletion: "Completado de Tratamientos",
    serviceCompletion: "Completado de Servicios",
    noShowRate: "Tasa de No-Show",
    consultationCompletion: "Completado de Consultas",
    clientRetention: "Retención de Clientes",
    serviceEfficiency: "Eficiencia de Servicio",
    firstTimeResolution: "Primera Resolución",
    inventoryValue: "Valor de Inventario",
    lowStockAlerts: "Alertas de Stock Bajo",
  };
  return labels[key] || key;
};

export function BusinessDashboardPage() {
  const { profile } = useProfile();
  const profileId = profile?.id || "";
  const businessType = profile?.businessTypeId ? "beauty" : "beauty"; // TODO: Get from profile
  
  // Fetch KPIs
  const { data: kpis, isLoading: isLoadingKPIs, refetch: refetchKPIs } = useBusinessKPIs(profileId, businessType);
  const { data: trends, isLoading: isLoadingTrends } = useBusinessKPITrends(profileId, 12);
  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useLowStockProducts(profileId);
  
  const [activeTab, setActiveTab] = useState("overview");

  // Loading state
  if (isLoadingKPIs) {
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
          <h1 className="text-2xl font-bold text-foreground">Panel de Negocios</h1>
          <p className="text-muted-foreground">
            Métricas y KPIs de tu negocio • {getIndustryLabel(kpis?.industryType || "beauty")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchKPIs()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Este mes: {formatCurrency(kpis?.currentMonthRevenue || 0)}
            </p>
            <div className={`text-xs flex items-center mt-1 ${getChangeColor(kpis?.revenueChange || 0)}`}>
              {kpis?.revenueChange && kpis.revenueChange > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {formatPercentage(kpis?.revenueChange || 0)} vs mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Citas Totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis?.totalAppointments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Este mes: {formatNumber(kpis?.currentMonthAppointments || 0)}
            </p>
            <div className={`text-xs flex items-center mt-1 ${getChangeColor(kpis?.appointmentsChange || 0)}`}>
              {kpis?.appointmentsChange && kpis.appointmentsChange > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {formatPercentage(kpis?.appointmentsChange || 0)} vs mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Únicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis?.totalClients || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Nuevos este mes: {formatNumber(kpis?.newClientsThisMonth || 0)}
            </p>
            <div className={`text-xs flex items-center mt-1 ${getChangeColor(kpis?.newClientsChange || 0)}`}>
              {kpis?.newClientsChange && kpis.newClientsChange > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {formatPercentage(kpis?.newClientsChange || 0)} vs mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Retention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Retención
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.retentionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Clientes recurrentes: {formatNumber(kpis?.returningClientsCount || 0)}
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              De {formatNumber(kpis?.totalClients || 0)} clientes totales
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="industry">KPIs por Industria</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Completion Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{kpis?.completionRate || 0}%</div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <div className="font-medium text-green-600">{kpis?.completedAppointments || 0}</div>
                    <div>Completadas</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">{kpis?.cancelledAppointments || 0}</div>
                    <div>Canceladas</div>
                  </div>
                  <div>
                    <div className="font-medium text-yellow-600">{kpis?.noShowAppointments || 0}</div>
                    <div>No-show</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Value */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{formatCurrency(kpis?.totalInventoryValue || 0)}</div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Stock bajo: {kpis?.lowStockCount || 0} productos
                </p>
              </CardContent>
            </Card>

            {/* New Clients This Month */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{kpis?.newClientsThisMonth || 0}</div>
                  <UserPlus className="h-8 w-8 text-purple-500" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  El mes pasado: {kpis?.newClientsLastMonth || 0} clientes
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Industry KPIs Tab */}
        <TabsContent value="industry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                KPIs de {getIndustryLabel(kpis?.industryType || "beauty")}
              </CardTitle>
              <CardDescription>
                Métricas específicas para tu tipo de negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {kpis?.industryKPIs && Object.entries(kpis.industryKPIs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{getKPILabel(key)}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof value === "number" && key.includes("Rate") || key.includes("utilization") || key.includes("Retention") || key.includes("Completion") || key.includes("Resolution")
                          ? `${value}%`
                          : typeof value === "number"
                            ? formatNumber(value)
                            : value
                        }
                      </p>
                    </div>
                    {typeof value === "number" && (key.includes("Rate") || key.includes("utilization") || key.includes("Retention") || key.includes("Completion") || key.includes("Resolution")) ? (
                      value >= 70 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : value >= 50 ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )
                    ) : key === "lowStockAlerts" && Number(value) > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas y Notificaciones
              </CardTitle>
              <CardDescription>
                Elementos que requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Low Stock Alerts */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Bajo
                  </h4>
                  {isLoadingLowStock ? (
                    <Skeleton className="h-20 w-full" />
                  ) : lowStockProducts && lowStockProducts.length > 0 ? (
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
                            Stock: {product.inventoryItem?.quantity || 0} / Mín: {product.minStock}
                          </Badge>
                        </div>
                      ))}
                      {lowStockProducts.length > 5 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/dashboard/inventory?filter=low-stock">
                            Ver todos ({lowStockProducts.length})
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        No hay productos con stock bajo
                      </span>
                    </div>
                  )}
                </div>

                {/* Other Alerts */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Citas
                  </h4>
                  <div className="space-y-2">
                    {/* No Shows */}
                    {kpis?.noShowAppointments && kpis.noShowAppointments > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Citas no asistidas</p>
                          <p className="text-xs text-muted-foreground">
                            Tasa: {kpis.noShowRate}% del total
                          </p>
                        </div>
                        <Badge variant="outline" className="border-red-500 text-red-700">
                          {kpis.noShowAppointments}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Cancellation Rate */}
                    {kpis?.cancelledAppointments && kpis.cancelledAppointments > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Citas canceladas</p>
                          <p className="text-xs text-muted-foreground">
                            Considera enviar recordatorios
                          </p>
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          {kpis.cancelledAppointments}
                        </Badge>
                      </div>
                    )}

                    {(!kpis?.noShowAppointments || kpis.noShowAppointments === 0) && 
                     (!kpis?.cancelledAppointments || kpis.cancelledAppointments === 0) && (
                      <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          No hay alertas de citas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tendencias Mensuales
              </CardTitle>
              <CardDescription>
                Evolución de ingresos y citas en los últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTrends ? (
                <Skeleton className="h-64 w-full" />
              ) : trends && trends.length > 0 ? (
                <div className="space-y-4">
                  {/* Revenue Trend */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ingresos por Mes</h4>
                    <div className="h-32 flex items-end gap-1">
                      {trends.map((month, index) => {
                        const maxRevenue = Math.max(...trends.map(t => t.revenue), 1);
                        const height = (month.revenue / maxRevenue) * 100;
                        return (
                          <div key={month.month} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${month.month}: ${formatCurrency(month.revenue)}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{trends[0]?.month}</span>
                      <span>{trends[trends.length - 1]?.month}</span>
                    </div>
                  </div>

                  {/* Appointments Trend */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Citas por Mes</h4>
                    <div className="h-32 flex items-end gap-1">
                      {trends.map((month, index) => {
                        const maxAppointments = Math.max(...trends.map(t => t.appointments), 1);
                        const height = (month.appointments / maxAppointments) * 100;
                        return (
                          <div key={month.month} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-blue-500/80 rounded-t hover:bg-blue-500 transition-colors"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${month.month}: ${month.appointments} citas`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{trends[0]?.month}</span>
                      <span>{trends[trends.length - 1]?.month}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No hay datos de tendencias disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
