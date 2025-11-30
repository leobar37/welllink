import { eq, and, desc, gte, lte, count, inArray } from "drizzle-orm";
import { db } from "../../db";
import { profileView, socialClick, profile, socialLink } from "../../db/schema";
import type { RequestContext } from "../../types/context";

export class AnalyticsRepository {
  // Profile Views
  async createProfileView(data: typeof profileView.$inferInsert) {
    const [view] = await db.insert(profileView).values(data).returning();
    return view;
  }

  async getProfileViews(ctx: RequestContext, profileId: string) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    return db.query.profileView.findMany({
      where: eq(profileView.profileId, profileId),
      orderBy: desc(profileView.viewedAt),
    });
  }

  async getProfileViewsCount(ctx: RequestContext, profileId: string) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    const [result] = await db
      .select({ count: count() })
      .from(profileView)
      .where(eq(profileView.profileId, profileId));

    return result?.count || 0;
  }

  async getProfileViewsByDateRange(
    ctx: RequestContext,
    profileId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    return db.query.profileView.findMany({
      where: and(
        eq(profileView.profileId, profileId),
        gte(profileView.viewedAt, startDate),
        lte(profileView.viewedAt, endDate),
      ),
      orderBy: desc(profileView.viewedAt),
    });
  }

  // Social Clicks
  async createSocialClick(data: { socialLinkId: string }) {
    const [click] = await db
      .insert(socialClick)
      .values({
        socialLinkId: data.socialLinkId,
      })
      .returning();
    return click;
  }

  async getSocialClicks(ctx: RequestContext, profileId: string) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    // Get all social links for this profile
    const profileSocialLinks = await db.query.socialLink.findMany({
      where: eq(socialLink.profileId, profileId),
    });

    if (profileSocialLinks.length === 0) {
      return [];
    }

    const socialLinkIds = profileSocialLinks.map((link) => link.id);

    // Get clicks for those social links
    return db.query.socialClick.findMany({
      where: inArray(socialClick.socialLinkId, socialLinkIds),
      with: {
        socialLink: true,
      },
      orderBy: desc(socialClick.clickedAt),
    });
  }

  async getSocialClicksByPlatform(
    ctx: RequestContext,
    profileId: string,
    platform: string,
  ) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    // Get social links for this profile and platform
    const profileSocialLinks = await db.query.socialLink.findMany({
      where: and(
        eq(socialLink.profileId, profileId),
        eq(
          socialLink.platform,
          platform as
            | "whatsapp"
            | "instagram"
            | "tiktok"
            | "facebook"
            | "youtube",
        ),
      ),
    });

    if (profileSocialLinks.length === 0) {
      return [];
    }

    const socialLinkIds = profileSocialLinks.map((link) => link.id);

    return db.query.socialClick.findMany({
      where: inArray(socialClick.socialLinkId, socialLinkIds),
      with: {
        socialLink: true,
      },
      orderBy: desc(socialClick.clickedAt),
    });
  }

  async getSocialClicksByDateRange(
    ctx: RequestContext,
    profileId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Verify profile ownership
    const foundProfile = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!foundProfile) {
      throw new Error("Profile not found or access denied");
    }

    // Get all social links for this profile
    const profileSocialLinks = await db.query.socialLink.findMany({
      where: eq(socialLink.profileId, profileId),
    });

    if (profileSocialLinks.length === 0) {
      return [];
    }

    const socialLinkIds = profileSocialLinks.map((link) => link.id);

    return db.query.socialClick.findMany({
      where: and(
        inArray(socialClick.socialLinkId, socialLinkIds),
        gte(socialClick.clickedAt, startDate),
        lte(socialClick.clickedAt, endDate),
      ),
      with: {
        socialLink: true,
      },
      orderBy: desc(socialClick.clickedAt),
    });
  }
}
