import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  automationAction,
  type AutomationAction,
  type NewAutomationAction,
} from "../../db/schema/automation-action";

export class AutomationActionRepository {
  /**
   * Create a new action
   */
  async create(data: NewAutomationAction) {
    const [result] = await db.insert(automationAction).values(data).returning();
    return result;
  }

  /**
   * Find action by ID
   */
  async findById(id: string) {
    return db.query.automationAction.findFirst({
      where: eq(automationAction.id, id),
    });
  }

  /**
   * Find all actions for an automation
   */
  async findByAutomationId(automationId: string) {
    return db.query.automationAction.findMany({
      where: eq(automationAction.automationId, automationId),
      orderBy: [automationAction.order],
    });
  }

  /**
   * Find all active actions for an automation (ordered by execution order)
   */
  async findActiveByAutomationId(automationId: string) {
    return db.query.automationAction.findMany({
      where: and(
        eq(automationAction.automationId, automationId),
        eq(automationAction.isActive, true)
      ),
      orderBy: [automationAction.order],
    });
  }

  /**
   * Find all active actions for multiple automations
   */
  async findActiveByAutomationIds(automationIds: string[]) {
    if (automationIds.length === 0) {
      return [];
    }
    return db.query.automationAction.findMany({
      where: and(
        inArray(automationAction.automationId, automationIds),
        eq(automationAction.isActive, true)
      ),
      orderBy: [automationAction.order],
    });
  }

  /**
   * Update an action
   */
  async update(id: string, data: Partial<NewAutomationAction>) {
    const [result] = await db
      .update(automationAction)
      .set(data)
      .where(eq(automationAction.id, id))
      .returning();
    return result;
  }

  /**
   * Delete an action
   */
  async delete(id: string) {
    await db.delete(automationAction).where(eq(automationAction.id, id));
  }

  /**
   * Delete all actions for an automation
   */
  async deleteByAutomationId(automationId: string) {
    await db.delete(automationAction).where(eq(automationAction.automationId, automationId));
  }
}
