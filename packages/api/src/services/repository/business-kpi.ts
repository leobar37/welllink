import { db } from "../../db";
import { client } from "../../db/schema/client";
import { reservation, type Reservation } from "../../db/schema/reservation";
import { inventoryItem } from "../../db/schema/inventory-item";
import { product } from "../../db/schema/product";
import { stockMovement } from "../../db/schema/stock-movement";
import { eq, and, gte, lte, desc, sql, count, gt, lt, countDistinct } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";

export interface BusinessKPIData {
  // Revenue
  totalRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueChange: number; // percentage change
  
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

export interface MonthlyData {
  month: string;
  revenue: number;
  appointments: number;
  newClients: number;
}

export class BusinessKPIRepository {
  /**
   * Get revenue data for a profile
   */
  async getRevenueData(
    profileId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ total: number; byMonth: MonthlyData[] }> {
    const now = new Date();
    const defaultStart = subMonths(now, 12); // Last 12 months
    const defaultEnd = now;
    
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;
    
    // Get completed reservations with payment
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${reservation.priceAtBooking} AS NUMERIC)), 0)`,
        scheduledAtUtc: reservation.scheduledAtUtc,
      })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          eq(reservation.status, "completed"),
          gte(reservation.scheduledAtUtc, startOfDay(start)),
          lte(reservation.scheduledAtUtc, endOfDay(end))
        )
      );
    
    const total = Number(result[0]?.total || 0);
    
    // Get by month
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(CAST(${reservation.priceAtBooking} AS NUMERIC)), 0)`,
      })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          eq(reservation.status, "completed"),
          gte(reservation.scheduledAtUtc, startOfDay(start)),
          lte(reservation.scheduledAtUtc, endOfDay(end))
        )
      )
      .groupBy(sql`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`);
    
    const byMonth: MonthlyData[] = monthlyData.map((row) => ({
      month: row.month,
      revenue: Number(row.total),
      appointments: 0,
      newClients: 0,
    }));
    
    return { total, byMonth };
  }
  
  /**
   * Get appointment counts
   */
  async getAppointmentStats(
    profileId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ total: number; completed: number; cancelled: number; noShow: number; byMonth: MonthlyData[] }> {
    const now = new Date();
    const defaultStart = subMonths(now, 12);
    const defaultEnd = now;
    
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;
    
    const [totalResult, completedResult, cancelledResult, noShowResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(reservation)
        .where(
          and(
            eq(reservation.profileId, profileId),
            gte(reservation.scheduledAtUtc, startOfDay(start)),
            lte(reservation.scheduledAtUtc, endOfDay(end))
          )
        ),
      db
        .select({ count: count() })
        .from(reservation)
        .where(
          and(
            eq(reservation.profileId, profileId),
            eq(reservation.status, "completed"),
            gte(reservation.scheduledAtUtc, startOfDay(start)),
            lte(reservation.scheduledAtUtc, endOfDay(end))
          )
        ),
      db
        .select({ count: count() })
        .from(reservation)
        .where(
          and(
            eq(reservation.profileId, profileId),
            eq(reservation.status, "cancelled"),
            gte(reservation.scheduledAtUtc, startOfDay(start)),
            lte(reservation.scheduledAtUtc, endOfDay(end))
          )
        ),
      db
        .select({ count: count() })
        .from(reservation)
        .where(
          and(
            eq(reservation.profileId, profileId),
            eq(reservation.status, "no_show"),
            gte(reservation.scheduledAtUtc, startOfDay(start)),
            lte(reservation.scheduledAtUtc, endOfDay(end))
          )
        ),
    ]);
    
    // Get by month
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`,
        count: count(),
      })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          gte(reservation.scheduledAtUtc, startOfDay(start)),
          lte(reservation.scheduledAtUtc, endOfDay(end))
        )
      )
      .groupBy(sql`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${reservation.scheduledAtUtc}, 'YYYY-MM')`);
    
    const byMonth: MonthlyData[] = monthlyData.map((row) => ({
      month: row.month,
      revenue: 0,
      appointments: Number(row.count),
      newClients: 0,
    }));
    
    return {
      total: Number(totalResult[0]?.count || 0),
      completed: Number(completedResult[0]?.count || 0),
      cancelled: Number(cancelledResult[0]?.count || 0),
      noShow: Number(noShowResult[0]?.count || 0),
      byMonth,
    };
  }
  
  /**
   * Get client counts (unique customers)
   */
  async getClientStats(
    profileId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ total: number; newThisMonth: number; newLastMonth: number; returning: number }> {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const defaultStart = subMonths(now, 12);
    const defaultEnd = now;
    
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;
    
    // Get total unique clients
    const totalResult = await db
      .select({ count: countDistinct(reservation.customerPhone) })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          gte(reservation.scheduledAtUtc, startOfDay(start)),
          lte(reservation.scheduledAtUtc, endOfDay(end))
        )
      );
    
    // Get new clients this month (first reservation this month)
    const newThisMonthResult = await db
      .select({ count: countDistinct(reservation.customerPhone) })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          gte(reservation.scheduledAtUtc, startOfDay(thisMonthStart)),
          lte(reservation.scheduledAtUtc, endOfDay(now))
        )
      );
    
    // Get new clients last month
    const newLastMonthResult = await db
      .select({ count: countDistinct(reservation.customerPhone) })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          gte(reservation.scheduledAtUtc, startOfDay(lastMonthStart)),
          lte(reservation.scheduledAtUtc, endOfDay(lastMonthEnd))
        )
      );
    
    // Get returning clients (more than 1 reservation)
    const returningResult = await db
      .select({
        phone: reservation.customerPhone,
        count: count(),
      })
      .from(reservation)
      .where(
        and(
          eq(reservation.profileId, profileId),
          gte(reservation.scheduledAtUtc, startOfDay(start)),
          lte(reservation.scheduledAtUtc, endOfDay(end))
        )
      )
      .groupBy(reservation.customerPhone)
      .having(sql`${count()} > 1`);
    
    return {
      total: Number(totalResult[0]?.count || 0),
      newThisMonth: Number(newThisMonthResult[0]?.count || 0),
      newLastMonth: Number(newLastMonthResult[0]?.count || 0),
      returning: returningResult.length,
    };
  }
  
  /**
   * Get low stock products count
   */
  async getLowStockCount(profileId: string): Promise<number> {
    // Get products with inventory items where quantity < min_stock
    const result = await db
      .select({ count: count() })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(
        and(
          eq(inventoryItem.profileId, profileId),
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantity} < ${product.minStock}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
  
  /**
   * Get total inventory value
   */
  async getInventoryValue(profileId: string): Promise<number> {
    const result = await db
      .select({
        value: sql<number>`COALESCE(SUM(${inventoryItem.quantity} * CAST(${inventoryItem.averageCost} AS NUMERIC)), 0)`,
      })
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.profileId, profileId),
          eq(inventoryItem.isActive, true)
        )
      );
    
    return Number(result[0]?.value || 0);
  }
}
