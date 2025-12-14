import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  campaignTemplate,
  type CampaignTemplate,
  type NewCampaignTemplate,
} from "../../db/schema/campaign-template";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class CampaignTemplateRepository {
  async create(data: NewCampaignTemplate) {
    const [result] = await db.insert(campaignTemplate).values(data).returning();
    return result;
  }

  async findByUser(ctx: RequestContext) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaignTemplate.findMany({
      where: inArray(campaignTemplate.profileId, profileIds),
      orderBy: desc(campaignTemplate.lastUsedAt),
    });
  }

  async findById(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaignTemplate.findFirst({
      where: and(
        eq(campaignTemplate.id, id),
        inArray(campaignTemplate.profileId, profileIds),
      ),
    });
  }

  async update(ctx: RequestContext, id: string, data: Partial<NewCampaignTemplate>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(campaignTemplate)
      .set(data)
      .where(
        and(
          eq(campaignTemplate.id, id),
          inArray(campaignTemplate.profileId, profileIds),
        ),
      )
      .returning();
    return result;
  }

  async delete(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .delete(campaignTemplate)
      .where(
        and(
          eq(campaignTemplate.id, id),
          inArray(campaignTemplate.profileId, profileIds),
        ),
      )
      .returning();
    return result;
  }

  async incrementUsage(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(campaignTemplate)
      .set({
        usageCount: sql`${campaignTemplate.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(
        and(
          eq(campaignTemplate.id, id),
          inArray(campaignTemplate.profileId, profileIds),
        ),
      )
      .returning();

    return result;
  }
}
