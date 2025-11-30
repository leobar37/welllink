import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { healthSurveyResponse } from "../../db/schema";

type SurveyInsert = typeof healthSurveyResponse.$inferInsert;

export class HealthSurveyRepository {
  async create(data: SurveyInsert) {
    const [response] = await db
      .insert(healthSurveyResponse)
      .values(data)
      .returning();

    return response;
  }

  async findByProfile(profileId: string) {
    return db.query.healthSurveyResponse.findMany({
      where: eq(healthSurveyResponse.profileId, profileId),
      orderBy: desc(healthSurveyResponse.createdAt),
    });
  }

  async findOne(id: string) {
    return db.query.healthSurveyResponse.findFirst({
      where: eq(healthSurveyResponse.id, id),
    });
  }

  async findOneByProfile(id: string, profileId: string) {
    return db.query.healthSurveyResponse.findFirst({
      where: and(
        eq(healthSurveyResponse.id, id),
        eq(healthSurveyResponse.profileId, profileId)
      ),
    });
  }

  async findLatest(profileId: string) {
    const responses = await db.query.healthSurveyResponse.findMany({
      where: eq(healthSurveyResponse.profileId, profileId),
      orderBy: desc(healthSurveyResponse.createdAt),
      limit: 1,
    });

    return responses[0] ?? null;
  }

  async update(id: string, profileId: string, data: Partial<SurveyInsert>) {
    const [response] = await db
      .update(healthSurveyResponse)
      .set(data)
      .where(
        and(
          eq(healthSurveyResponse.id, id),
          eq(healthSurveyResponse.profileId, profileId)
        )
      )
      .returning();

    return response;
  }

  async delete(id: string, profileId: string) {
    const [response] = await db
      .delete(healthSurveyResponse)
      .where(
        and(
          eq(healthSurveyResponse.id, id),
          eq(healthSurveyResponse.profileId, profileId)
        )
      )
      .returning();

    return response;
  }

  async findByDateRange(profileId: string, startDate: Date, endDate: Date) {
    return db.query.healthSurveyResponse.findMany({
      where: and(
        eq(healthSurveyResponse.profileId, profileId),
        gte(healthSurveyResponse.createdAt, startDate),
        lte(healthSurveyResponse.createdAt, endDate)
      ),
      orderBy: desc(healthSurveyResponse.createdAt),
    });
  }

  async countByProfile(profileId: string) {
    const responses = await db.query.healthSurveyResponse.findMany({
      where: eq(healthSurveyResponse.profileId, profileId),
    });
    return responses.length;
  }
}
