import { db } from "../../db";
import { service } from "../../db/schema/service";
import { eq, and, desc } from "drizzle-orm";
import type {
  Service,
  NewService,
} from "../../db/schema/service";

export class ServiceRepository {
  async create(data: NewService): Promise<Service> {
    const [newService] = await db
      .insert(service)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newService) {
      throw new Error("Failed to create service");
    }

    return newService;
  }

  async findById(id: string): Promise<Service | null> {
    const [foundService] = await db
      .select()
      .from(service)
      .where(eq(service.id, id));

    return foundService || null;
  }

  async findByProfileId(profileId: string): Promise<Service[]> {
    return await db
      .select()
      .from(service)
      .where(eq(service.profileId, profileId))
      .orderBy(desc(service.createdAt));
  }

  async findActiveByProfileId(profileId: string): Promise<Service[]> {
    return await db
      .select()
      .from(service)
      .where(
        and(
          eq(service.profileId, profileId),
          eq(service.isActive, true),
        ),
      )
      .orderBy(desc(service.createdAt));
  }

  async update(
    id: string,
    data: Partial<Service>,
  ): Promise<Service> {
    const [updatedService] = await db
      .update(service)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(service.id, id))
      .returning();

    if (!updatedService) {
      throw new Error("Service not found");
    }

    return updatedService;
  }

  async delete(id: string): Promise<void> {
    await db
      .update(service)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(service.id, id));
  }

  async findByCategory(category: string): Promise<Service[]> {
    return await db
      .select()
      .from(service)
      .where(
        and(
          eq(service.category, category),
          eq(service.isActive, true),
        ),
      )
      .orderBy(desc(service.createdAt));
  }
}
