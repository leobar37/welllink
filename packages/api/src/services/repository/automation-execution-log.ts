import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  automationExecutionLog,
  type AutomationExecutionLog,
  type NewAutomationExecutionLog,
} from "../../db/schema/automation-execution-log";

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
}
