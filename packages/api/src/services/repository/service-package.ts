import { eq, and, asc } from "drizzle-orm";
import { db } from "../../db";
import { servicePackage, type ServicePackage, type NewServicePackage } from "../../db/schema/service-package";

export class ServicePackageRepository {
  async create(data: NewServicePackage): Promise<ServicePackage> {
    const [created] = await db.insert(servicePackage).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<ServicePackage | null> {
    const [result] = await db
      .select()
      .from(servicePackage)
      .where(eq(servicePackage.id, id))
      .limit(1);
    return result || null;
  }

  async findByProfileId(profileId: string): Promise<ServicePackage[]> {
    return db
      .select()
      .from(servicePackage)
      .where(eq(servicePackage.profileId, profileId))
      .orderBy(asc(servicePackage.createdAt));
  }

  async findActiveByProfileId(profileId: string): Promise<ServicePackage[]> {
    return db
      .select()
      .from(servicePackage)
      .where(
        and(
          eq(servicePackage.profileId, profileId),
          eq(servicePackage.isActive, true)
        )
      )
      .orderBy(asc(servicePackage.createdAt));
  }

  async update(id: string, data: Partial<NewServicePackage>): Promise<ServicePackage | null> {
    const [updated] = await db
      .update(servicePackage)
      .set(data)
      .where(eq(servicePackage.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(servicePackage)
      .where(eq(servicePackage.id, id));
    return true;
  }

  async softDelete(id: string): Promise<ServicePackage | null> {
    const [updated] = await db
      .update(servicePackage)
      .set({ isActive: false })
      .where(eq(servicePackage.id, id))
      .returning();
    return updated || null;
  }
}
