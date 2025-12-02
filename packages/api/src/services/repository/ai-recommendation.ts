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
    return db.query.aiRecommendation.findMany({
      where: eq(aiRecommendation.profileId, profileId),
      orderBy: desc(aiRecommendation.createdAt),
      with: {
        surveyResponse: true,
      },
    });
  }

  async findOne(id: string) {
    return db.query.aiRecommendation.findFirst({
      where: eq(aiRecommendation.id, id),
      with: {
        surveyResponse: true,
      },
    });
  }

  async findOneByProfile(id: string, profileId: string) {
    return db.query.aiRecommendation.findFirst({
      where: and(
        eq(aiRecommendation.id, id),
        eq(aiRecommendation.profileId, profileId)
      ),
      with: {
        surveyResponse: true,
      },
    });
  }

  async findBySurveyResponse(surveyResponseId: string) {
    return db.query.aiRecommendation.findFirst({
      where: eq(aiRecommendation.surveyResponseId, surveyResponseId),
      with: {
        surveyResponse: true,
      },
    });
  }

  async findLatestByProfile(profileId: string) {
    const recommendations = await db.query.aiRecommendation.findMany({
      where: eq(aiRecommendation.profileId, profileId),
      orderBy: desc(aiRecommendation.createdAt),
      limit: 1,
      with: {
        surveyResponse: true,
      },
    });

    return recommendations[0] ?? null;
  }

  async update(
    id: string,
    profileId: string,
    data: Partial<RecommendationInsert>
  ) {
    const [recommendation] = await db
      .update(aiRecommendation)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(aiRecommendation.id, id),
          eq(aiRecommendation.profileId, profileId)
        )
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
          eq(aiRecommendation.profileId, profileId)
        )
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
