import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BusinessKPIData {
  // Revenue
  totalRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueChange: number;
  
  // Appointments
  totalAppointments: number;
  currentMonthAppointments: number;
  previousMonthAppointments: number;
  appointmentsChange: number;
  
  // New Clients
  totalClients: number;
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  newClientsChange: number;
  
  // Retention
  returningClientsCount: number;
  retentionRate: number;
  
  // Additional metrics
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  
  // Inventory metrics
  lowStockCount: number;
  totalInventoryValue: number;
  
  // Industry-specific
  industryType: string;
  industryKPIs: Record<string, number | string>;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  appointments: number;
  newClients: number;
}

export function useBusinessKPIs(profileId: string, businessType?: string) {
  return useQuery({
    queryKey: ["business-kpis", profileId, businessType],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (businessType) {
        params.businessType = businessType;
      }
      const { data, error } = await api.api["business-kpi"].dashboard.get({ $query: params });
      if (error) throw error;
      return data as unknown as BusinessKPIData;
    },
    enabled: !!profileId,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBusinessKPITrends(profileId: string, months: number = 12) {
  return useQuery({
    queryKey: ["business-kpi-trends", profileId, months],
    queryFn: async () => {
      const { data, error } = await api.api["business-kpi"].trends.get({
        $query: { months: months.toString() }
      });
      if (error) throw error;
      return data as unknown as MonthlyTrend[];
    },
    enabled: !!profileId,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
  });
}
