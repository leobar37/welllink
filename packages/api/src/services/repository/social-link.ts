import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { socialLink, profile } from '../../db/schema';
import type { RequestContext } from '../../types/context';

export class SocialLinkRepository {
  async findByProfile(ctx: RequestContext, profileId: string) {
    return db.query.socialLink.findMany({
      where: eq(socialLink.profileId, profileId),
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const socialLinkData = await db.query.socialLink.findFirst({
      where: eq(socialLink.id, id),
      with: {
        profile: true,
      },
    });

    // Ensure user can only access social links from their profiles
    if (socialLinkData?.profile.userId !== ctx.userId) {
      return null;
    }

    return socialLinkData;
  }

  async create(ctx: RequestContext, data: typeof socialLink.$inferInsert) {
    // Verify profile ownership
    const profileData = await db.query.profile.findFirst({
      where: and(
        eq(profile.id, data.profileId),
        eq(profile.userId, ctx.userId)
      ),
    });

    if (!profileData) {
      throw new Error('Profile not found or access denied');
    }

    const [socialLinkData] = await db.insert(socialLink)
      .values(data)
      .returning();

    return socialLinkData;
  }

  async update(ctx: RequestContext, id: string, data: Partial<typeof socialLink.$inferInsert>) {
    // First verify ownership through profile
    const existing = await db.query.socialLink.findFirst({
      where: eq(socialLink.id, id),
      with: {
        profile: true,
      },
    });

    if (!existing || existing.profile.userId !== ctx.userId) {
      throw new Error('Social link not found or access denied');
    }

    const [socialLinkData] = await db.update(socialLink)
      .set(data)
      .where(eq(socialLink.id, id))
      .returning();

    return socialLinkData;
  }

  async delete(ctx: RequestContext, id: string) {
    // First verify ownership through profile
    const existing = await db.query.socialLink.findFirst({
      where: eq(socialLink.id, id),
      with: {
        profile: true,
      },
    });

    if (!existing || existing.profile.userId !== ctx.userId) {
      throw new Error('Social link not found or access denied');
    }

    const [socialLinkData] = await db.delete(socialLink)
      .where(eq(socialLink.id, id))
      .returning();

    return socialLinkData;
  }
}
