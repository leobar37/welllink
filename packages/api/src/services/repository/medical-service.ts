import { db } from "../../db";
import { medicalService } from "../../db/schema/medical-service";
import { eq, and, desc } from "drizzle-orm";
import type {
  MedicalService,
  NewMedicalService,
} from "../../db/schema/medical-service";

export class MedicalServiceRepository {
  async create(data: NewMedicalService): Promise<MedicalService> {
    const [service] = await db
      .insert(medicalService)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!service) {
      throw new Error("Failed to create medical service");
    }

    return service;
  }

  async findById(id: string): Promise<MedicalService | null> {
    const [service] = await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.id, id));

    return service || null;
  }

  async findByProfileId(profileId: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(eq(medicalService.profileId, profileId))
      .orderBy(desc(medicalService.createdAt));
  }

  async findActiveByProfileId(profileId: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(
        and(
          eq(medicalService.profileId, profileId),
          eq(medicalService.isActive, true),
        ),
      )
      .orderBy(desc(medicalService.createdAt));
  }

  async update(
    id: string,
    data: Partial<MedicalService>,
  ): Promise<MedicalService> {
    const [service] = await db
      .update(medicalService)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(medicalService.id, id))
      .returning();

    if (!service) {
      throw new Error("Service not found");
    }

    return service;
  }

  async delete(id: string): Promise<void> {
    await db
      .update(medicalService)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(medicalService.id, id));
  }

  async findByCategory(category: string): Promise<MedicalService[]> {
    return await db
      .select()
      .from(medicalService)
      .where(
        and(
          eq(medicalService.category, category),
          eq(medicalService.isActive, true),
        ),
      )
      .orderBy(desc(medicalService.createdAt));
  }
}
