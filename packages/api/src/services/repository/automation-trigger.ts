import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  automationTrigger,
  type AutomationTrigger,
  type NewAutomationTrigger,
} from "../../db/schema/automation-trigger";

export class AutomationTriggerRepository {
  /**
   * Create a new trigger
   */
  async create(data: NewAutomationTrigger) {
    const [result] = await db.insert(automationTrigger).values(data).returning();
    return result;
  }

  /**
   * Find trigger by ID
   */
  async findById(id: string) {
    return db.query.automationTrigger.findFirst({
      where: eq(automationTrigger.id, id),
    });
  }

  /**
   * Find all triggers for an automation
   */
  async findByAutomationId(automationId: string) {
    return db.query.automationTrigger.findMany({
      where: eq(automationTrigger.automationId, automationId),
      orderBy: (trigger) => [trigger.createdAt],
    });
  }

  /**
   * Find all active triggers for an automation
   */
  async findActiveByAutomationId(automationId: string) {
    return db.query.automationTrigger.findMany({
      where: and(
        eq(automationTrigger.automationId, automationId),
        eq(automationTrigger.isActive, true)
      ),
      orderBy: (trigger) => [trigger.createdAt],
    });
  }

  /**
   * Find all active event triggers for a profile by event type
   */
  async findEventTriggersByProfileAndEventType(profileId: string, eventType: string) {
    // First get all automations for the profile that are enabled
    const { automation } = await import("../../db/schema/automation");
    const { inArray: inArraySql, eq: eqSql, and: andSql } = await import("drizzle-orm");
    
    const automations = await db
      .select({ id: automation.id })
      .from(automation)
      .where(andSql(eqSql(automation.profileId, profileId), eqSql(automation.enabled, true)));
    
    if (automations.length === 0) {
      return [];
    }

    const automationIds = automations.map(a => a.id);

    // Then get the triggers for those automations that match the event type
    return db.query.automationTrigger.findMany({
      where: and(
        inArray(automationTrigger.automationId, automationIds),
        eq(automationTrigger.type, "event"),
        eq(automationTrigger.isActive, true)
      ),
      orderBy: (trigger) => [trigger.createdAt],
    });
  }

  /**
   * Update a trigger
   */
  async update(id: string, data: Partial<NewAutomationTrigger>) {
    const [result] = await db
      .update(automationTrigger)
      .set(data)
      .where(eq(automationTrigger.id, id))
      .returning();
    return result;
  }

  /**
   * Delete a trigger
   */
  async delete(id: string) {
    await db.delete(automationTrigger).where(eq(automationTrigger.id, id));
  }

  /**
   * Delete all triggers for an automation
   */
  async deleteByAutomationId(automationId: string) {
    await db.delete(automationTrigger).where(eq(automationTrigger.automationId, automationId));
  }
}
