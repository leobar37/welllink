import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  campaignAudience,
  type CampaignAudience,
  type NewCampaignAudience,
  CampaignAudienceStatus,
} from "../../db/schema/campaign-audience";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class CampaignAudienceRepository {
  async create(data: NewCampaignAudience) {
    const [result] = await db.insert(campaignAudience).values(data).returning();
    return result;
  }

  async createMany(data: NewCampaignAudience[]) {
    return db.insert(campaignAudience).values(data).returning();
  }

  async findByCampaign(ctx: RequestContext, campaignId: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaignAudience.findMany({
      where: and(
        eq(campaignAudience.campaignId, campaignId),
        inArray(campaignAudience.profileId, profileIds),
      ),
      orderBy: desc(campaignAudience.createdAt),
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

    return db.query.campaignAudience.findFirst({
      where: and(
        eq(campaignAudience.id, id),
        inArray(campaignAudience.profileId, profileIds),
      ),
    });
  }

  async update(
    ctx: RequestContext,
    id: string,
    data: Partial<NewCampaignAudience>,
  ) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(campaignAudience)
      .set(data)
      .where(
        and(
          eq(campaignAudience.id, id),
          inArray(campaignAudience.profileId, profileIds),
        ),
      )
      .returning();
    return result;
  }

  async getByStatus(
    ctx: RequestContext,
    campaignId: string,
    status: CampaignAudienceStatus,
  ) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaignAudience.findMany({
      where: and(
        eq(campaignAudience.campaignId, campaignId),
        eq(campaignAudience.status, status),
        inArray(campaignAudience.profileId, profileIds),
      ),
    });
  }
}
