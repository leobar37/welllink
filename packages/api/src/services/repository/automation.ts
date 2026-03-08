import { eq, and, desc, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  automation,
  type Automation,
  type NewAutomation,
} from "../../db/schema/automation";

export class AutomationRepository {
  /**
   * Create a new automation
   */
  async create(data: NewAutomation) {
    const [result] = await db.insert(automation).values(data).returning();
    return result;
  }

  /**
   * Find automation by ID
   */
  async findById(id: string) {
    return db.query.automation.findFirst({
      where: eq(automation.id, id),
    });
  }

  /**
   * Find all automations for a profile
   */
  async findByProfileId(profileId: string, options?: {
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(automation.profileId, profileId)];
    
    if (options?.enabled !== undefined) {
      conditions.push(eq(automation.enabled, options.enabled));
    }

    return db.query.automation.findMany({
      where: and(...conditions),
      orderBy: [desc(automation.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all enabled automations for a profile (for trigger evaluation)
   */
  async findEnabledByProfileId(profileId: string) {
    return db.query.automation.findMany({
      where: and(
        eq(automation.profileId, profileId),
        eq(automation.enabled, true)
      ),
      orderBy: [desc(automation.priority), desc(automation.createdAt)],
    });
  }

  /**
   * Update an automation
   */
  async update(id: string, data: Partial<NewAutomation>) {
    const [result] = await db
      .update(automation)
      .set(data)
      .where(eq(automation.id, id))
      .returning();
    return result;
  }

  /**
   * Delete an automation
   */
  async delete(id: string) {
    await db.delete(automation).where(eq(automation.id, id));
  }

  /**
   * Toggle automation enabled state
   */
  async toggleEnabled(id: string, enabled: boolean) {
    const [result] = await db
      .update(automation)
      .set({ enabled })
      .where(eq(automation.id, id))
      .returning();
    return result;
  }
}
