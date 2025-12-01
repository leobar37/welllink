import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { story } from "../../db/schema";

type StoryInsert = typeof story.$inferInsert;

export class StoryRepository {
  async listByProfile(profileId: string) {
    return db.query.story.findMany({
      where: eq(story.profileId, profileId),
      orderBy: asc(story.order),
    });
  }

  async listPublishedByProfile(profileId: string) {
    return db.query.story.findMany({
      where: and(eq(story.profileId, profileId), eq(story.isPublished, true)),
      orderBy: asc(story.order),
    });
  }

  async findById(id: string) {
    return db.query.story.findFirst({
      where: eq(story.id, id),
    });
  }

  async create(data: StoryInsert) {
    const [result] = await db.insert(story).values(data).returning();
    return result;
  }

  async update(id: string, data: Partial<StoryInsert>) {
    const [result] = await db
      .update(story)
      .set(data)
      .where(eq(story.id, id))
      .returning();
    return result;
  }

  async delete(id: string) {
    const [result] = await db
      .delete(story)
      .where(eq(story.id, id))
      .returning();
    return result;
  }

  async getNextOrder(profileId: string) {
    const last = await db.query.story.findFirst({
      where: eq(story.profileId, profileId),
      orderBy: desc(story.order),
    });

    return typeof last?.order === "number" ? last.order + 1 : 0;
  }

  async countPublished(profileId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(story)
      .where(and(eq(story.profileId, profileId), eq(story.isPublished, true)));

    return result?.count ?? 0;
  }

  async reorder(profileId: string, orderedIds: Array<{ id: string; order: number }>) {
    if (orderedIds.length === 0) {
      return [];
    }

    const ids = orderedIds.map((item) => item.id);
    const existing = await db.query.story.findMany({
      where: and(eq(story.profileId, profileId), inArray(story.id, ids)),
    });

    // Ensure all stories exist
    if (existing.length !== orderedIds.length) {
      throw new Error("Some stories were not found for this profile");
    }

    const updated: typeof existing = [];
    await db.transaction(async (tx) => {
      for (const item of orderedIds) {
        const [result] = await tx
          .update(story)
          .set({ order: item.order })
          .where(and(eq(story.id, item.id), eq(story.profileId, profileId)))
          .returning();

        if (result) {
          updated.push(result);
        }
      }
    });

    return updated;
  }
}
