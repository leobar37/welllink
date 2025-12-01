import { eq } from "drizzle-orm";
import { db } from "../../db";
import { storySection } from "../../db/schema";

type StorySectionInsert = typeof storySection.$inferInsert;

export class StorySectionRepository {
  async findByProfileId(profileId: string) {
    return db.query.storySection.findFirst({
      where: eq(storySection.profileId, profileId),
    });
  }

  async create(profileId: string, data: Partial<StorySectionInsert>) {
    const [result] = await db
      .insert(storySection)
      .values({
        profileId,
        title: "Mi historia",
        ...data,
      })
      .returning();

    return result;
  }

  async update(id: string, data: Partial<StorySectionInsert>) {
    const [result] = await db
      .update(storySection)
      .set(data)
      .where(eq(storySection.id, id))
      .returning();

    return result;
  }
}
