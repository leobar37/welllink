import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  campaign,
  type Campaign,
  type NewCampaign,
} from "../../db/schema/campaign";
import { profile } from "../../db/schema/profile";
import type { CampaignStatus } from "../../db/schema/campaign";
import type { RequestContext } from "../../types/context";

export class CampaignRepository {
  async create(data: NewCampaign) {
    const [result] = await db.insert(campaign).values(data).returning();
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

    return db.query.campaign.findMany({
      where: inArray(campaign.profileId, profileIds),
      orderBy: desc(campaign.createdAt),
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

    return db.query.campaign.findFirst({
      where: and(eq(campaign.id, id), inArray(campaign.profileId, profileIds)),
    });
  }

  async update(ctx: RequestContext, id: string, data: Partial<NewCampaign>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(campaign)
      .set(data)
      .where(and(eq(campaign.id, id), inArray(campaign.profileId, profileIds)))
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
      .delete(campaign)
      .where(and(eq(campaign.id, id), inArray(campaign.profileId, profileIds)))
      .returning();
    return result;
  }

  async getByStatus(ctx: RequestContext, status: CampaignStatus) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaign.findMany({
      where: and(
        eq(campaign.status, status),
        inArray(campaign.profileId, profileIds),
      ),
      orderBy: desc(campaign.createdAt),
    });
  }

  async getScheduledCampaigns(ctx: RequestContext) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.campaign.findMany({
      where: and(
        eq(campaign.status, sql`${campaign.status}`), // This ensures proper typing
        inArray(campaign.profileId, profileIds),
      ),
      orderBy: desc(campaign.scheduledAt),
    });
  }
}
