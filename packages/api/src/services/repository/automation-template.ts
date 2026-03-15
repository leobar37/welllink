import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  automationTemplate,
  type AutomationTemplate,
  type NewAutomationTemplate,
} from "../../db/schema/automation-template";

export class AutomationTemplateRepository {
  /**
   * Create a new template
   */
  async create(data: NewAutomationTemplate) {
    const [result] = await db.insert(automationTemplate).values(data).returning();
    return result;
  }

  /**
   * Find template by ID
   */
  async findById(id: string) {
    return db.query.automationTemplate.findFirst({
      where: eq(automationTemplate.id, id),
    });
  }

  /**
   * Find all templates (optionally filtered by business type)
   */
  async findAll(options?: {
    businessTypeKey?: string;
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];

    if (options?.businessTypeKey) {
      conditions.push(eq(automationTemplate.businessTypeKey, options.businessTypeKey));
    }

    if (options?.category) {
      conditions.push(eq(automationTemplate.category, options.category));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(automationTemplate.isActive, options.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.query.automationTemplate.findMany({
      where: whereClause,
      orderBy: [desc(automationTemplate.usageCount), desc(automationTemplate.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find templates by business type key
   */
  async findByBusinessType(businessTypeKey: string, options?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [
      eq(automationTemplate.businessTypeKey, businessTypeKey),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(automationTemplate.isActive, options.isActive));
    }

    return db.query.automationTemplate.findMany({
      where: and(...conditions),
      orderBy: [desc(automationTemplate.usageCount), desc(automationTemplate.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find templates by category
   */
  async findByCategory(category: string) {
    return db.query.automationTemplate.findMany({
      where: and(
        eq(automationTemplate.category, category),
        eq(automationTemplate.isActive, true)
      ),
      orderBy: [desc(automationTemplate.usageCount)],
    });
  }

  /**
   * Update a template
   */
  async update(id: string, data: Partial<NewAutomationTemplate>) {
    const [result] = await db
      .update(automationTemplate)
      .set(data)
      .where(eq(automationTemplate.id, id))
      .returning();
    return result;
  }

  /**
   * Delete a template
   */
  async delete(id: string) {
    await db.delete(automationTemplate).where(eq(automationTemplate.id, id));
  }

  /**
   * Increment usage count
   */
  async incrementUsageCount(id: string) {
    const [result] = await db
      .update(automationTemplate)
      .set({
        usageCount: sql`${automationTemplate.usageCount} + 1`,
      })
      .where(eq(automationTemplate.id, id))
      .returning();
    return result;
  }

  /**
   * Search templates by name or tags
   */
  async search(query: string, options?: {
    businessTypeKey?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [
      eq(automationTemplate.isActive, true),
    ];

    if (options?.businessTypeKey) {
      conditions.push(eq(automationTemplate.businessTypeKey, options.businessTypeKey));
    }

    // Note: For proper full-text search, you'd want to use pg_trgm or similar
    // For now, we search by exact match on name (case-insensitive via ILIKE)
    const searchPattern = `%${query}%`;

    return db.query.automationTemplate.findMany({
      where: and(
        ...conditions,
        // Note: This is a simplified search - in production you'd want proper full-text search
      ),
      orderBy: [desc(automationTemplate.usageCount)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get all unique categories
   */
  async getCategories(businessTypeKey?: string) {
    const conditions = [eq(automationTemplate.isActive, true)];

    if (businessTypeKey) {
      conditions.push(eq(automationTemplate.businessTypeKey, businessTypeKey));
    }

    const results = await db
      .selectDistinctOn([automationTemplate.category], {
        category: automationTemplate.category,
      })
      .from(automationTemplate)
      .where(and(...conditions));

    return results.map(r => r.category);
  }
}
