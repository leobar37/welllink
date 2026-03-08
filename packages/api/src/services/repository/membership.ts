import { eq, and, asc } from "drizzle-orm";
import { db } from "../../db";
import { membership, type Membership, type NewMembership } from "../../db/schema/membership";

export class MembershipRepository {
  async create(data: NewMembership): Promise<Membership> {
    const [created] = await db.insert(membership).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<Membership | null> {
    const [result] = await db
      .select()
      .from(membership)
      .where(eq(membership.id, id))
      .limit(1);
    return result || null;
  }

  async findByProfileId(profileId: string): Promise<Membership[]> {
    return db
      .select()
      .from(membership)
      .where(eq(membership.profileId, profileId))
      .orderBy(asc(membership.createdAt));
  }

  async findActiveByProfileId(profileId: string): Promise<Membership[]> {
    return db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.profileId, profileId),
          eq(membership.isActive, true)
        )
      )
      .orderBy(asc(membership.createdAt));
  }

  async update(id: string, data: Partial<NewMembership>): Promise<Membership | null> {
    const [updated] = await db
      .update(membership)
      .set(data)
      .where(eq(membership.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string): Promise<boolean> {
    await db
      .delete(membership)
      .where(eq(membership.id, id));
    return true;
  }

  async softDelete(id: string): Promise<Membership | null> {
    const [updated] = await db
      .update(membership)
      .set({ isActive: false })
      .where(eq(membership.id, id))
      .returning();
    return updated || null;
  }
}
