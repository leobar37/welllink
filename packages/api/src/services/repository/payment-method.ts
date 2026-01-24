import { db } from "../../db";
import { paymentMethod } from "../../db/schema/payment-method";
import { profile } from "../../db/schema/profile";
import { eq, asc, and, desc } from "drizzle-orm";
import type {
  PaymentMethod,
  NewPaymentMethod,
} from "../../db/schema/payment-method";
import type { RequestContext } from "../../types/context";

export class PaymentMethodRepository {
  async findById(id: string): Promise<PaymentMethod | null> {
    const [method] = await db
      .select()
      .from(paymentMethod)
      .where(eq(paymentMethod.id, id));

    return method || null;
  }

  async findByProfileId(profileId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethod)
      .where(eq(paymentMethod.profileId, profileId))
      .orderBy(asc(paymentMethod.displayOrder));
  }

  async findActiveByProfileId(profileId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethod)
      .where(
        and(
          eq(paymentMethod.profileId, profileId),
          eq(paymentMethod.isActive, true),
        ),
      )
      .orderBy(asc(paymentMethod.displayOrder));
  }

  async findOneByIdWithProfile(
    ctx: RequestContext,
    id: string,
  ): Promise<PaymentMethod | null> {
    const [method] = await db
      .select({
        pm: paymentMethod,
      })
      .from(paymentMethod)
      .innerJoin(profile, eq(paymentMethod.profileId, profile.id))
      .where(and(eq(paymentMethod.id, id), eq(profile.userId, ctx.userId)));

    return method?.pm || null;
  }

  async create(data: NewPaymentMethod): Promise<PaymentMethod> {
    const [method] = await db
      .insert(paymentMethod)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!method) {
      throw new Error("Failed to create payment method");
    }

    return method;
  }

  async createMany(
    profileId: string,
    methods: Array<Omit<NewPaymentMethod, "profileId">>,
  ): Promise<PaymentMethod[]> {
    const methodsWithProfile = methods.map((method) => ({
      ...method,
      profileId,
    }));

    const results = await db
      .insert(paymentMethod)
      .values(
        methodsWithProfile.map((m) => ({
          ...m,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .returning();

    return results;
  }

  async update(
    id: string,
    data: Partial<PaymentMethod>,
  ): Promise<PaymentMethod> {
    const [method] = await db
      .update(paymentMethod)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethod.id, id))
      .returning();

    if (!method) {
      throw new Error("Payment method not found");
    }

    return method;
  }

  async delete(id: string): Promise<void> {
    await db.delete(paymentMethod).where(eq(paymentMethod.id, id));
  }

  async deleteByProfileId(profileId: string): Promise<void> {
    await db
      .delete(paymentMethod)
      .where(eq(paymentMethod.profileId, profileId));
  }

  async reorder(
    profileId: string,
    methodIds: string[],
  ): Promise<PaymentMethod[]> {
    const updates = methodIds.map((methodId, index) =>
      this.update(methodId, { displayOrder: index }),
    );

    await Promise.all(updates);
    return this.findByProfileId(profileId);
  }

  async deactivateAll(profileId: string): Promise<void> {
    await db
      .update(paymentMethod)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethod.profileId, profileId));
  }

  async countByProfileId(profileId: string): Promise<number> {
    const result = await db
      .select({ count: paymentMethod.id })
      .from(paymentMethod)
      .where(eq(paymentMethod.profileId, profileId));

    return result.length;
  }
}
