import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { profile } from "../../db/schema";
import type { RequestContext } from "../../types/context";

export class ProfileRepository {
  async findByUser(_ctx: RequestContext, userId: string) {
    return db.query.profile.findMany({
      where: eq(profile.userId, userId),
      with: {
        avatar: true,
        coverImage: true,
        customization: true,
        socialLinks: true,
      },
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const profileData = await db.query.profile.findFirst({
      where: and(
        eq(profile.id, id),
        eq(profile.userId, ctx.userId), // Ensure user can only access their profiles
      ),
      with: {
        avatar: true,
        coverImage: true,
        customization: true,
        socialLinks: true,
      },
    });

    return profileData;
  }

  async create(
    ctx: RequestContext,
    data: Omit<typeof profile.$inferInsert, "userId">,
  ) {
    const [profileData] = await db
      .insert(profile)
      .values({
        ...data,
        userId: ctx.userId,
      })
      .returning();

    return profileData;
  }

  async update(
    ctx: RequestContext,
    id: string,
    data: Partial<typeof profile.$inferInsert>,
  ) {
    const [profileData] = await db
      .update(profile)
      .set(data)
      .where(and(eq(profile.id, id), eq(profile.userId, ctx.userId)))
      .returning();

    return profileData;
  }

  async delete(ctx: RequestContext, id: string) {
    const [profileData] = await db
      .delete(profile)
      .where(and(eq(profile.id, id), eq(profile.userId, ctx.userId)))
      .returning();

    return profileData;
  }

  async findByUsername(_ctx: RequestContext, username: string) {
    const profileData = await db.query.profile.findFirst({
      where: eq(profile.username, username),
      with: {
        avatar: true,
        coverImage: true,
        customization: true,
        socialLinks: true,
      },
    });

    return profileData;
  }
}
