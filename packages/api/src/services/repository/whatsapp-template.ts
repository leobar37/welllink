import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { whatsappTemplate, TemplateStatus, TemplateCategory } from "../../db/schema/whatsapp-template";
import type { RequestContext } from "../../types/context";

export class WhatsAppTemplateRepository {
  async findByConfig(ctx: RequestContext, configId: string) {
    return db.query.whatsappTemplate.findMany({
      where: eq(whatsappTemplate.configId, configId),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const template = await db.query.whatsappTemplate.findFirst({
      where: eq(whatsappTemplate.id, id),
      with: {
        config: {
          columns: {
            profileId: true,
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own templates
    if (template?.config.userId !== ctx.userId) {
      return null;
    }

    return template;
  }

  async findByName(ctx: RequestContext, configId: string, name: string) {
    const template = await db.query.whatsappTemplate.findFirst({
      where: and(
        eq(whatsappTemplate.configId, configId),
        eq(whatsappTemplate.name, name)
      ),
      with: {
        config: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own templates
    if (template?.config.userId !== ctx.userId) {
      return null;
    }

    return template;
  }

  async findActive(ctx: RequestContext, configId: string) {
    return db.query.whatsappTemplate.findMany({
      where: and(
        eq(whatsappTemplate.configId, configId),
        eq(whatsappTemplate.isActive, true),
        eq(whatsappTemplate.status, TemplateStatus.APPROVED)
      ),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });
  }

  async findByStatus(ctx: RequestContext, configId: string, status: TemplateStatus) {
    return db.query.whatsappTemplate.findMany({
      where: and(
        eq(whatsappTemplate.configId, configId),
        eq(whatsappTemplate.status, status)
      ),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });
  }

  async findByCategory(ctx: RequestContext, configId: string, category: TemplateCategory) {
    return db.query.whatsappTemplate.findMany({
      where: and(
        eq(whatsappTemplate.configId, configId),
        eq(whatsappTemplate.category, category),
        eq(whatsappTemplate.isActive, true)
      ),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });
  }

  async create(ctx: RequestContext, data: Omit<typeof whatsappTemplate.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [template] = await db
      .insert(whatsappTemplate)
      .values(data)
      .returning();

    return template;
  }

  async update(ctx: RequestContext, id: string, data: Partial<typeof whatsappTemplate.$inferInsert>) {
    const [template] = await db
      .update(whatsappTemplate)
      .set(data)
      .where(eq(whatsappTemplate.id, id))
      .returning();

    return template;
  }

  async delete(ctx: RequestContext, id: string) {
    const [template] = await db
      .delete(whatsappTemplate)
      .where(eq(whatsappTemplate.id, id))
      .returning();

    return template;
  }

  async updateStatus(
    ctx: RequestContext,
    id: string,
    status: TemplateStatus,
    waTemplateId?: string,
    rejectionReason?: string
  ) {
    const updateData: Partial<typeof whatsappTemplate.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };

    if (waTemplateId) {
      updateData.waTemplateId = waTemplateId;
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const [template] = await db
      .update(whatsappTemplate)
      .set(updateData)
      .where(eq(whatsappTemplate.id, id))
      .returning();

    return template;
  }

  async incrementUsage(ctx: RequestContext, id: string) {
    const [template] = await db
      .update(whatsappTemplate)
      .set({
        usageCount: db.sql`CAST(usage_count AS INTEGER) + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappTemplate.id, id))
      .returning();

    return template;
  }

  async toggleActive(ctx: RequestContext, id: string, isActive: boolean) {
    const [template] = await db
      .update(whatsappTemplate)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(whatsappTemplate.id, id))
      .returning();

    return template;
  }

  async getTemplatesByLanguage(ctx: RequestContext, configId: string, language: string) {
    return db.query.whatsappTemplate.findMany({
      where: and(
        eq(whatsappTemplate.configId, configId),
        eq(whatsappTemplate.language, language),
        eq(whatsappTemplate.isActive, true)
      ),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });
  }

  async searchTemplates(ctx: RequestContext, configId: string, query: string) {
    const templates = await db.query.whatsappTemplate.findMany({
      where: and(
        eq(whatsappTemplate.configId, configId),
        db.sql`(name ILIKE ${`%${query}%`} OR display_name ILIKE ${`%${query}%`})`
      ),
      orderBy: [desc(whatsappTemplate.createdAt)],
    });

    // Filter out templates that don't belong to the user
    return templates.filter(template => template.config.userId === ctx.userId);
  }

  async getTemplateStats(ctx: RequestContext, configId: string) {
    const stats = await db
      .select({
        total: db.sql`COUNT(*)`,
        draft: db.sql`SUM(CASE WHEN status = '${TemplateStatus.DRAFT}' THEN 1 ELSE 0 END)`,
        pending: db.sql`SUM(CASE WHEN status = '${TemplateStatus.PENDING}' THEN 1 ELSE 0 END)`,
        approved: db.sql`SUM(CASE WHEN status = '${TemplateStatus.APPROVED}' THEN 1 ELSE 0 END)`,
        rejected: db.sql`SUM(CASE WHEN status = '${TemplateStatus.REJECTED}' THEN 1 ELSE 0 END)`,
        disabled: db.sql`SUM(CASE WHEN status = '${TemplateStatus.DISABLED}' THEN 1 ELSE 0 END)`,
        active: db.sql`SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END)`,
      })
      .from(whatsappTemplate)
      .where(eq(whatsappTemplate.configId, configId));

    return stats[0] || {
      total: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      disabled: 0,
      active: 0,
    };
  }
}