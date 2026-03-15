import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  automationExecutionLog,
  type AutomationExecutionLog,
  type NewAutomationExecutionLog,
} from "../../db/schema/automation-execution-log";
import { automation } from "../../db/schema/automation";

export interface GlobalAutomationStats {
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  pendingCount: number;
  runningCount: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
}

export interface AutomationUsage {
  automationId: string;
  automationName: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt: string | null;
}

export interface ExecutionTrend {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export class AutomationExecutionLogRepository {
  /**
   * Create a new execution log entry
   */
  async create(data: NewAutomationExecutionLog) {
    const [result] = await db.insert(automationExecutionLog).values(data).returning();
    return result;
  }

  /**
   * Find log by ID
   */
  async findById(id: string) {
    return db.query.automationExecutionLog.findFirst({
      where: eq(automationExecutionLog.id, id),
    });
  }

  /**
   * Find all logs for an automation
   */
  async findByAutomationId(automationId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    let query = db.query.automationExecutionLog.findMany({
      where: eq(automationExecutionLog.automationId, automationId),
      orderBy: [desc(automationExecutionLog.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });

    // Note: Status filtering would need to be added as additional condition if needed
    return query;
  }

  /**
   * Get the latest execution log for an automation
   */
  async findLatestByAutomationId(automationId: string) {
    return db.query.automationExecutionLog.findFirst({
      where: eq(automationExecutionLog.automationId, automationId),
      orderBy: [desc(automationExecutionLog.createdAt)],
    });
  }

  /**
   * Update execution log with results
   */
  async update(id: string, data: Partial<NewAutomationExecutionLog>) {
    const [result] = await db
      .update(automationExecutionLog)
      .set(data)
      .where(eq(automationExecutionLog.id, id))
      .returning();
    return result;
  }

  /**
   * Mark execution as started
   */
  async markStarted(id: string) {
    const [result] = await db
      .update(automationExecutionLog)
      .set({ 
        status: "running" as const,
        startedAt: new Date()
      })
      .where(eq(automationExecutionLog.id, id))
      .returning();
    return result;
  }

  /**
   * Mark execution as completed
   */
  async markCompleted(
    id: string, 
    status: "success" | "partial" | "failed",
    actionsExecuted: NewAutomationExecutionLog["actionsExecuted"],
    executionResult?: NewAutomationExecutionLog["result"],
    error?: string
  ) {
    const [updatedLog] = await db
      .update(automationExecutionLog)
      .set({ 
        status,
        actionsExecuted,
        result: executionResult,
        error,
        completedAt: new Date(),
        durationMs: sql`EXTRACT(EPOCH FROM (NOW() - ${automationExecutionLog.startedAt})) * 1000`
      })
      .where(eq(automationExecutionLog.id, id))
      .returning();
    return updatedLog;
  }

  /**
   * Get execution statistics for an automation
   */
  async getStatsByAutomationId(automationId: string) {
    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        success: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'success')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'failed')`,
        partial: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'partial')`,
      })
      .from(automationExecutionLog)
      .where(eq(automationExecutionLog.automationId, automationId));

    return stats[0];
  }

  /**
   * Delete old logs (for cleanup)
   */
  async deleteOlderThan(date: Date) {
    await db
      .delete(automationExecutionLog)
      .where(sql`${automationExecutionLog.createdAt} < ${date}`);
  }

  /**
   * Get global automation statistics for a profile
   */
  async getGlobalStats(profileId: string): Promise<GlobalAutomationStats> {
    // First get all automation IDs for this profile
    const automations = await db
      .select({ id: automation.id })
      .from(automation)
      .where(eq(automation.profileId, profileId));

    if (automations.length === 0) {
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

    const automationIds = automations.map((a) => a.id);

    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        success: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'success')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'failed')`,
        partial: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'partial')`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'pending')`,
        running: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'running')`,
        avgDuration: sql<number>`COALESCE(AVG(${automationExecutionLog.durationMs}), 0)`,
      })
      .from(automationExecutionLog)
      .where(inArray(automationExecutionLog.automationId, automationIds));

    const s = stats[0];
    const total = Number(s.total) || 0;
    const successRate = total > 0 ? (Number(s.success) / total) * 100 : 0;
    const failureRate = total > 0 ? (Number(s.failed) / total) * 100 : 0;

    return {
      totalExecutions: total,
      successCount: Number(s.success) || 0,
      failedCount: Number(s.failed) || 0,
      partialCount: Number(s.partial) || 0,
      pendingCount: Number(s.pending) || 0,
      runningCount: Number(s.running) || 0,
      successRate: Math.round(successRate * 10) / 10,
      failureRate: Math.round(failureRate * 10) / 10,
      averageDuration: Math.round(Number(s.avgDuration) || 0),
    };
  }

  /**
   * Get most used automations (by execution count)
   */
  async getMostUsedAutomations(profileId: string, limit: number = 10): Promise<AutomationUsage[]> {
    const automations = await db
      .select({ id: automation.id })
      .from(automation)
      .where(eq(automation.profileId, profileId));

    if (automations.length === 0) {
      return [];
    }

    const automationIds = automations.map((a) => a.id);

    const results = await db
      .select({
        automationId: automationExecutionLog.automationId,
        automationName: automation.name,
        executionCount: sql<number>`COUNT(*)`,
        successCount: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'success')`,
        failureCount: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'failed')`,
        lastExecutedAt: sql<string | null>`MAX(${automationExecutionLog.createdAt})`,
      })
      .from(automationExecutionLog)
      .innerJoin(automation, eq(automationExecutionLog.automationId, automation.id))
      .where(inArray(automationExecutionLog.automationId, automationIds))
      .groupBy(automationExecutionLog.automationId, automation.name)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return results.map((r) => ({
      automationId: r.automationId,
      automationName: r.automationName,
      executionCount: Number(r.executionCount),
      successCount: Number(r.successCount),
      failureCount: Number(r.failureCount),
      lastExecutedAt: r.lastExecutedAt,
    }));
  }

  /**
   * Get execution trends over time
   */
  async getExecutionTrend(profileId: string, days: number = 30): Promise<ExecutionTrend[]> {
    const automations = await db
      .select({ id: automation.id })
      .from(automation)
      .where(eq(automation.profileId, profileId));

    if (automations.length === 0) {
      return [];
    }

    const automationIds = automations.map((a) => a.id);

    const results = await db
      .select({
        date: sql<string>`DATE(${automationExecutionLog.createdAt})`,
        total: sql<number>`COUNT(*)`,
        success: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'success')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE ${automationExecutionLog.status} = 'failed')`,
      })
      .from(automationExecutionLog)
      .where(
        and(
          inArray(automationExecutionLog.automationId, automationIds),
          sql`${automationExecutionLog.createdAt} >= NOW() - INTERVAL '${days} days'`
        )
      )
      .groupBy(sql`DATE(${automationExecutionLog.createdAt})`)
      .orderBy(sql`DATE(${automationExecutionLog.createdAt})`);

    return results.map((r) => ({
      date: r.date,
      total: Number(r.total),
      success: Number(r.success),
      failed: Number(r.failed),
    }));
  }

  /**
   * Get global execution logs for all automations in a profile
   */
  async findByProfileId(
    profileId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      automationId?: string;
      search?: string;
    }
  ) {
    const automations = await db
      .select({ id: automation.id })
      .from(automation)
      .where(eq(automation.profileId, profileId));

    if (automations.length === 0) {
      return [];
    }

    const automationIds = automations.map((a) => a.id);

    // Build conditions
    const conditions = [inArray(automationExecutionLog.automationId, automationIds)];

    if (options?.status && options.status !== "all") {
      conditions.push(eq(automationExecutionLog.status, options.status as any));
    }

    if (options?.automationId) {
      conditions.push(eq(automationExecutionLog.automationId, options.automationId));
    }

    // Note: Search would need additional implementation for full-text search

    return db.query.automationExecutionLog.findMany({
      where: and(...conditions),
      orderBy: [desc(automationExecutionLog.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
      with: {
        automation: {
          columns: {
            name: true,
          },
        },
      },
    });
  }
}
