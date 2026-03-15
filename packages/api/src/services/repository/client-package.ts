import { eq, and, asc, sql } from "drizzle-orm";
import { db } from "../../db";
import { clientPackage, type ClientPackage, type NewClientPackage, ClientPackageStatus } from "../../db/schema/client-package";

export class ClientPackageRepository {
  async create(data: NewClientPackage): Promise<ClientPackage> {
    const [created] = await db.insert(clientPackage).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<ClientPackage | null> {
    const [result] = await db
      .select()
      .from(clientPackage)
      .where(eq(clientPackage.id, id))
      .limit(1);
    return result || null;
  }

  async findByClientId(clientId: string): Promise<ClientPackage[]> {
    return db
      .select()
      .from(clientPackage)
      .where(eq(clientPackage.clientId, clientId))
      .orderBy(asc(clientPackage.purchasedAt));
  }

  async findActiveByClientId(clientId: string): Promise<ClientPackage[]> {
    return db
      .select()
      .from(clientPackage)
      .where(
        and(
          eq(clientPackage.clientId, clientId),
          eq(clientPackage.status, ClientPackageStatus.ACTIVE)
        )
      )
      .orderBy(asc(clientPackage.purchasedAt));
  }

  async findByProfileId(profileId: string): Promise<ClientPackage[]> {
    return db
      .select()
      .from(clientPackage)
      .where(eq(clientPackage.profileId, profileId))
      .orderBy(asc(clientPackage.purchasedAt));
  }

  async findByPackageId(packageId: string): Promise<ClientPackage[]> {
    return db
      .select()
      .from(clientPackage)
      .where(eq(clientPackage.packageId, packageId));
  }

  async findByMembershipId(membershipId: string): Promise<ClientPackage[]> {
    return db
      .select()
      .from(clientPackage)
      .where(eq(clientPackage.membershipId, membershipId));
  }

  async update(id: string, data: Partial<NewClientPackage>): Promise<ClientPackage | null> {
    const [updated] = await db
      .update(clientPackage)
      .set(data)
      .where(eq(clientPackage.id, id))
      .returning();
    return updated || null;
  }

  async decrementSessions(id: string, count: number = 1): Promise<ClientPackage | null> {
    const [updated] = await db
      .update(clientPackage)
      .set({
        remainingSessions: sql`GREATEST(${clientPackage.remainingSessions} - ${count}, 0)`,
        status: sql`CASE 
          WHEN (${clientPackage.remainingSessions} - ${count}) <= 0 
          THEN '${ClientPackageStatus.EXHAUSTED}'::varchar 
          ELSE ${clientPackage.status} 
        END`,
      })
      .where(eq(clientPackage.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string): Promise<boolean> {
    await db
      .delete(clientPackage)
      .where(eq(clientPackage.id, id));
    return true;
  }

  async cancel(id: string): Promise<ClientPackage | null> {
    const [updated] = await db
      .update(clientPackage)
      .set({ status: ClientPackageStatus.CANCELLED })
      .where(eq(clientPackage.id, id))
      .returning();
    return updated || null;
  }

  async expire(id: string): Promise<ClientPackage | null> {
    const [updated] = await db
      .update(clientPackage)
      .set({ status: ClientPackageStatus.EXPIRED })
      .where(eq(clientPackage.id, id))
      .returning();
    return updated || null;
  }
}
