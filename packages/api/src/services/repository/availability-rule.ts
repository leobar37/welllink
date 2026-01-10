import { db } from "../../db";
import { availabilityRule } from "../../db/schema/availability-rule";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import type {
  AvailabilityRule,
  NewAvailabilityRule,
} from "../../db/schema/availability-rule";

export class AvailabilityRuleRepository {
  async create(data: NewAvailabilityRule): Promise<AvailabilityRule> {
    const [rule] = await db
      .insert(availabilityRule)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!rule) {
      throw new Error("Failed to create availability rule");
    }

    return rule;
  }

  async findById(id: string): Promise<AvailabilityRule | null> {
    const [rule] = await db
      .select()
      .from(availabilityRule)
      .where(eq(availabilityRule.id, id));

    return rule || null;
  }

  async findByProfileId(profileId: string): Promise<AvailabilityRule[]> {
    return await db
      .select()
      .from(availabilityRule)
      .where(
        and(
          eq(availabilityRule.profileId, profileId),
          eq(availabilityRule.isActive, true),
        ),
      )
      .orderBy(desc(availabilityRule.createdAt));
  }

  async findByDayOfWeek(
    profileId: string,
    dayOfWeek: number,
  ): Promise<AvailabilityRule[]> {
    return await db
      .select()
      .from(availabilityRule)
      .where(
        and(
          eq(availabilityRule.profileId, profileId),
          eq(availabilityRule.dayOfWeek, dayOfWeek),
          eq(availabilityRule.isActive, true),
        ),
      )
      .orderBy(availabilityRule.startTime);
  }

  async findActiveForDate(
    profileId: string,
    date: Date,
  ): Promise<AvailabilityRule[]> {
    const dayOfWeek = date.getDay();

    return await db
      .select()
      .from(availabilityRule)
      .where(
        and(
          eq(availabilityRule.profileId, profileId),
          eq(availabilityRule.dayOfWeek, dayOfWeek),
          eq(availabilityRule.isActive, true),
          gte(availabilityRule.effectiveFrom, date),
          lte(availabilityRule.effectiveTo || new Date("2099-12-31"), date),
        ),
      )
      .orderBy(availabilityRule.startTime);
  }

  async update(
    id: string,
    data: Partial<AvailabilityRule>,
  ): Promise<AvailabilityRule> {
    const [rule] = await db
      .update(availabilityRule)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(availabilityRule.id, id))
      .returning();

    if (!rule) {
      throw new Error("Availability rule not found");
    }

    return rule;
  }

  async deactivate(id: string): Promise<AvailabilityRule> {
    const [rule] = await db
      .update(availabilityRule)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(availabilityRule.id, id))
      .returning();

    if (!rule) {
      throw new Error("Availability rule not found");
    }

    return rule;
  }

  async delete(id: string): Promise<void> {
    await db.delete(availabilityRule).where(eq(availabilityRule.id, id));
  }
}
