import type { RequestContext } from "../../types/context";
import { BusinessKPIRepository, type BusinessKPIData, type MonthlyData } from "../repository/business-kpi";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

export interface BusinessKPIFilters {
  startDate?: Date;
  endDate?: Date;
  industryType?: string;
}

export interface BusinessKPIServiceConfig {
  profileId: string;
  businessType?: string;
}

export class BusinessKPIService {
  constructor(private businessKPIRepository: BusinessKPIRepository) {}

  /**
   * Get comprehensive business KPIs for a profile
   */
  async getBusinessKPIs(
    ctx: RequestContext,
    config: BusinessKPIServiceConfig
  ): Promise<BusinessKPIData> {
    const { profileId, businessType } = config;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));
    
    // Get revenue data
    const revenueData = await this.businessKPIRepository.getRevenueData(profileId);
    
    // Get current month revenue
    const currentMonthRevenueData = await this.businessKPIRepository.getRevenueData(
      profileId,
      currentMonthStart,
      now
    );
    
    // Get previous month revenue
    const previousMonthRevenueData = await this.businessKPIRepository.getRevenueData(
      profileId,
      previousMonthStart,
      previousMonthEnd
    );
    
    // Get appointment stats
    const appointmentStats = await this.businessKPIRepository.getAppointmentStats(profileId);
    const currentMonthAppointments = await this.businessKPIRepository.getAppointmentStats(
      profileId,
      currentMonthStart,
      now
    );
    const previousMonthAppointments = await this.businessKPIRepository.getAppointmentStats(
      profileId,
      previousMonthStart,
      previousMonthEnd
    );
    
    // Get client stats
    const clientStats = await this.businessKPIRepository.getClientStats(profileId);
    
    // Get inventory metrics
    const lowStockCount = await this.businessKPIRepository.getLowStockCount(profileId);
    const inventoryValue = await this.businessKPIRepository.getInventoryValue(profileId);
    
    // Calculate changes
    const revenueChange = previousMonthRevenueData.total > 0
      ? ((currentMonthRevenueData.total - previousMonthRevenueData.total) / previousMonthRevenueData.total) * 100
      : currentMonthRevenueData.total > 0 ? 100 : 0;
    
    const appointmentsChange = previousMonthAppointments.total > 0
      ? ((currentMonthAppointments.total - previousMonthAppointments.total) / previousMonthAppointments.total) * 100
      : currentMonthAppointments.total > 0 ? 100 : 0;
    
    const newClientsChange = clientStats.newLastMonth > 0
      ? ((clientStats.newThisMonth - clientStats.newLastMonth) / clientStats.newLastMonth) * 100
      : clientStats.newThisMonth > 0 ? 100 : 0;
    
    // Calculate retention rate
    const retentionRate = clientStats.total > 0
      ? (clientStats.returning / clientStats.total) * 100
      : 0;
    
    // Calculate completion rate
    const completionRate = appointmentStats.total > 0
      ? (appointmentStats.completed / appointmentStats.total) * 100
      : 0;
    
    // Get industry-specific KPIs
    const industryKPIs = this.calculateIndustryKPIs(businessType, {
      appointmentStats,
      clientStats,
      inventoryValue,
      lowStockCount,
    });
    
    return {
      totalRevenue: revenueData.total,
      currentMonthRevenue: currentMonthRevenueData.total,
      previousMonthRevenue: previousMonthRevenueData.total,
      revenueChange: Math.round(revenueChange * 10) / 10,
      
      totalAppointments: appointmentStats.total,
      currentMonthAppointments: currentMonthAppointments.total,
      previousMonthAppointments: previousMonthAppointments.total,
      appointmentsChange: Math.round(appointmentsChange * 10) / 10,
      
      totalClients: clientStats.total,
      newClientsThisMonth: clientStats.newThisMonth,
      newClientsLastMonth: clientStats.newLastMonth,
      newClientsChange: Math.round(newClientsChange * 10) / 10,
      
      returningClientsCount: clientStats.returning,
      retentionRate: Math.round(retentionRate * 10) / 10,
      
      completedAppointments: appointmentStats.completed,
      cancelledAppointments: appointmentStats.cancelled,
      noShowAppointments: appointmentStats.noShow,
      completionRate: Math.round(completionRate * 10) / 10,
      
      lowStockCount,
      totalInventoryValue: inventoryValue,
      
      industryType: businessType || "beauty",
      industryKPIs,
    };
  }

  /**
   * Get monthly trend data for charts
   */
  async getMonthlyTrends(
    profileId: string,
    months: number = 12
  ): Promise<MonthlyData[]> {
    const now = new Date();
    const startDate = subDays(startOfMonth(subMonths(now, months - 1)), 1);
    
    const revenueData = await this.businessKPIRepository.getRevenueData(profileId, startDate, now);
    const appointmentStats = await this.businessKPIRepository.getAppointmentStats(profileId, startDate, now);
    
    // Merge the data
    const mergedData: MonthlyData[] = [];
    const revenueByMonth = new Map(revenueData.byMonth.map(r => [r.month, r.revenue]));
    const appointmentsByMonth = new Map(appointmentStats.byMonth.map(a => [a.month, a.appointments]));
    
    // Get all unique months
    const allMonths = new Set([...revenueByMonth.keys(), ...appointmentsByMonth.keys()]);
    
    for (const month of Array.from(allMonths).sort()) {
      mergedData.push({
        month,
        revenue: revenueByMonth.get(month) || 0,
        appointments: appointmentsByMonth.get(month) || 0,
        newClients: 0, // Would need additional query
      });
    }
    
    return mergedData;
  }
  
  /**
   * Calculate industry-specific KPIs
   */
  private calculateIndustryKPIs(
    industryType?: string,
    data?: {
      appointmentStats: { total: number; completed: number; noShow: number };
      clientStats: { total: number; returning: number };
      inventoryValue: number;
      lowStockCount: number;
    }
  ): Record<string, number | string> {
    const kpis: Record<string, number | string> = {};
    
    if (!data) return kpis;
    
    const { appointmentStats, clientStats, inventoryValue, lowStockCount } = data;
    
    switch (industryType) {
      case "fitness":
        // Occupancy rate (for classes/sessions)
        kpis.occupancyRate = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        // Average utilization (completed vs total)
        kpis.utilizationRate = kpis.occupancyRate;
        break;
        
      case "health":
        // Patient retention rate
        kpis.patientRetention = clientStats.total > 0
          ? Math.round((clientStats.returning / clientStats.total) * 100 * 10) / 10
          : 0;
        // Treatment completion rate
        kpis.treatmentCompletion = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        break;
        
      case "beauty":
        // Service completion rate
        kpis.serviceCompletion = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        // No-show rate
        kpis.noShowRate = appointmentStats.total > 0
          ? Math.round((appointmentStats.noShow / appointmentStats.total) * 100 * 10) / 10
          : 0;
        break;
        
      case "professional":
        // Consultation completion
        kpis.consultationCompletion = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        // Client retention
        kpis.clientRetention = clientStats.total > 0
          ? Math.round((clientStats.returning / clientStats.total) * 100 * 10) / 10
          : 0;
        break;
        
      case "technical":
        // Service efficiency
        kpis.serviceEfficiency = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        // First-time resolution (new clients)
        kpis.firstTimeResolution = clientStats.total > 0
          ? Math.round(((clientStats.total - clientStats.returning) / clientStats.total) * 100 * 10) / 10
          : 0;
        break;
        
      default:
        // Default KPIs for any business type
        kpis.serviceCompletion = appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100 * 10) / 10
          : 0;
        kpis.noShowRate = appointmentStats.total > 0
          ? Math.round((appointmentStats.noShow / appointmentStats.total) * 100 * 10) / 10
          : 0;
    }
    
    // Add common KPIs
    kpis.inventoryValue = inventoryValue;
    kpis.lowStockAlerts = lowStockCount;
    
    return kpis;
  }
}
