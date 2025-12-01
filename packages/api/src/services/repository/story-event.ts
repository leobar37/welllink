import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { storyEvent } from "../../db/schema";

type StoryEventInsert = typeof storyEvent.$inferInsert;

export class StoryEventRepository {
  async record(data: StoryEventInsert) {
    const [result] = await db.insert(storyEvent).values(data).returning();
    return result;
  }

  async getEventCounts(
    profileId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const rows = await db
      .select({ eventType: storyEvent.eventType, count: count() })
      .from(storyEvent)
      .where(
        and(
          eq(storyEvent.profileId, profileId),
          gte(storyEvent.createdAt, startDate),
          lte(storyEvent.createdAt, endDate),
        ),
      )
      .groupBy(storyEvent.eventType);

    return rows;
  }

  async getRecentEvents(profileId: string, limit = 50) {
    return db.query.storyEvent.findMany({
      where: eq(storyEvent.profileId, profileId),
      orderBy: desc(storyEvent.createdAt),
      limit,
    });
  }
}
