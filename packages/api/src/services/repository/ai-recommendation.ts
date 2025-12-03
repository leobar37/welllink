import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { aiRecommendation } from "../../db/schema";

type RecommendationInsert = typeof aiRecommendation.$inferInsert;

export class AIRecommendationRepository {
  async create(data: RecommendationInsert) {
    const [recommendation] = await db
      .insert(aiRecommendation)
      .values(data)
      .returning();

    return recommendation;
  }

  async findByProfile(profileId: string) {
    // Use select instead of query builder to avoid relation issues
    return db
      .select()
      .from(aiRecommendation)
      .where(eq(aiRecommendation.profileId, profileId))
      .orderBy(desc(aiRecommendation.createdAt));
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(aiRecommendation)
      .where(eq(aiRecommendation.id, id))
      .limit(1);

    return result;
  }

  async findOneByProfile(id: string, profileId: string) {
    const [result] = await db
      .select()
      .from(aiRecommendation)
      .where(
        and(
          eq(aiRecommendation.id, id),
          eq(aiRecommendation.profileId, profileId),
        ),
      )
      .limit(1);

    return result;
  }

  async findBySurveyResponse(surveyResponseId: string) {
    const [result] = await db
      .select()
      .from(aiRecommendation)
      .where(eq(aiRecommendation.surveyResponseId, surveyResponseId))
      .limit(1);

    return result;
  }

  async findLatestByProfile(profileId: string) {
    const [result] = await db
      .select()
      .from(aiRecommendation)
      .where(eq(aiRecommendation.profileId, profileId))
      .orderBy(desc(aiRecommendation.createdAt))
      .limit(1);

    return result ?? null;
  }

  async update(
    id: string,
    profileId: string,
    data: Partial<RecommendationInsert>,
  ) {
    const [recommendation] = await db
      .update(aiRecommendation)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(aiRecommendation.id, id),
          eq(aiRecommendation.profileId, profileId),
        ),
      )
      .returning();

    return recommendation;
  }

  async delete(id: string, profileId: string) {
    const [recommendation] = await db
      .delete(aiRecommendation)
      .where(
        and(
          eq(aiRecommendation.id, id),
          eq(aiRecommendation.profileId, profileId),
        ),
      )
      .returning();

    return recommendation;
  }

  async countByProfile(profileId: string) {
    const recommendations = await db.query.aiRecommendation.findMany({
      where: eq(aiRecommendation.profileId, profileId),
    });
    return recommendations.length;
  }
}
