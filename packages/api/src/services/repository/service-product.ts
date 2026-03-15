import {
  eq,
  and,
  desc,
  inArray,
} from "drizzle-orm";
import { db } from "../../db";
import {
  serviceProduct,
  type ServiceProduct,
  type NewServiceProduct,
} from "../../db/schema/service-product";
import { product } from "../../db/schema/product";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

/**
 * Extended type for service-product with product details
 */
export interface ServiceProductWithProduct extends ServiceProduct {
  product: typeof product.$inferSelect;
}

/**
 * ServiceProduct Repository
 * Handles data access for service-product associations
 */
export class ServiceProductRepository {
  /**
   * Create a new service-product association
   */
  async create(data: NewServiceProduct) {
    const [result] = await db.insert(serviceProduct).values(data).returning();
    return result;
  }

  /**
   * Find service-product by ID
   */
  async findById(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.serviceProduct.findFirst({
      where: and(
        eq(serviceProduct.id, id),
        inArray(serviceProduct.profileId, profileIds)
      ),
    });
  }

  /**
   * Find service-product by ID and profile directly (for API routes)
   */
  async findByIdAndProfile(id: string, profileId: string): Promise<ServiceProduct | null> {
    const result = await db.query.serviceProduct.findFirst({
      where: and(
        eq(serviceProduct.id, id),
        eq(serviceProduct.profileId, profileId)
      ),
    });
    return result ?? null;
  }

  /**
   * Find all products for a service
   */
  async findByServiceId(ctx: RequestContext, serviceId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [
      eq(serviceProduct.serviceId, serviceId),
      inArray(serviceProduct.profileId, profileIds),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    return db.query.serviceProduct.findMany({
      where: and(...conditions),
      orderBy: desc(serviceProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all products for a service by profile directly
   */
  async findByServiceIdAndProfile(serviceId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [
      eq(serviceProduct.serviceId, serviceId),
      eq(serviceProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    return db.query.serviceProduct.findMany({
      where: and(...conditions),
      orderBy: desc(serviceProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all products for a service with product details
   */
  async findByServiceIdWithProduct(serviceId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }): Promise<ServiceProductWithProduct[]> {
    const conditions = [
      eq(serviceProduct.serviceId, serviceId),
      eq(serviceProduct.profileId, profileId),
    ];
    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    const results = await db.select()
      .from(serviceProduct)
      .leftJoin(product, eq(serviceProduct.productId, product.id))
      .where(and(...conditions))
      .orderBy(desc(serviceProduct.createdAt))
      .limit(options?.limit ?? 100)
      .offset(options?.offset ?? 0);

    return results.map((r) => ({
      ...r.service_product,
      product: r.product!,
    }));
  }

  /**
   * Find all services for a product
   */
  async findByProductId(ctx: RequestContext, productId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [
      eq(serviceProduct.productId, productId),
      inArray(serviceProduct.profileId, profileIds),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    return db.query.serviceProduct.findMany({
      where: and(...conditions),
      orderBy: desc(serviceProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all services for a product by profile directly
   */
  async findByProductIdAndProfile(productId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [
      eq(serviceProduct.productId, productId),
      eq(serviceProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    return db.query.serviceProduct.findMany({
      where: and(...conditions),
      orderBy: desc(serviceProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Check if service-product association already exists
   */
  async exists(serviceId: string, productId: string, profileId: string) {
    const existing = await db.query.serviceProduct.findFirst({
      where: and(
        eq(serviceProduct.serviceId, serviceId),
        eq(serviceProduct.productId, productId),
        eq(serviceProduct.profileId, profileId)
      ),
    });
    return !!existing;
  }

  /**
   * Update service-product association
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewServiceProduct>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(serviceProduct)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(serviceProduct.id, id),
        inArray(serviceProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Update service-product by ID and profile directly
   */
  async updateByIdAndProfile(id: string, profileId: string, data: Partial<NewServiceProduct>) {
    const [result] = await db
      .update(serviceProduct)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(serviceProduct.id, id),
        eq(serviceProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Soft delete service-product association
   */
  async delete(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(serviceProduct)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(serviceProduct.id, id),
        inArray(serviceProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Soft delete by ID and profile directly
   */
  async deleteByIdAndProfile(id: string, profileId: string) {
    const [result] = await db
      .update(serviceProduct)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(serviceProduct.id, id),
        eq(serviceProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Hard delete service-product association
   */
  async hardDelete(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .delete(serviceProduct)
      .where(and(
        eq(serviceProduct.id, id),
        inArray(serviceProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Hard delete by ID and profile directly
   */
  async hardDeleteByIdAndProfile(id: string, profileId: string) {
    const [result] = await db
      .delete(serviceProduct)
      .where(and(
        eq(serviceProduct.id, id),
        eq(serviceProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Delete all products for a service
   */
  async deleteByServiceId(serviceId: string, profileId: string) {
    const [result] = await db
      .update(serviceProduct)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(serviceProduct.serviceId, serviceId),
        eq(serviceProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Count products for a service
   */
  async countByServiceId(serviceId: string, profileId: string, options?: {
    isActive?: boolean;
  }) {
    const conditions = [
      eq(serviceProduct.serviceId, serviceId),
      eq(serviceProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    const result = await db
      .select({ count: serviceProduct.id })
      .from(serviceProduct)
      .where(and(...conditions));
    
    return result.length;
  }

  /**
   * Count services for a product
   */
  async countByProductId(productId: string, profileId: string, options?: {
    isActive?: boolean;
  }) {
    const conditions = [
      eq(serviceProduct.productId, productId),
      eq(serviceProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(serviceProduct.isActive, options.isActive));
    }

    const result = await db
      .select({ count: serviceProduct.id })
      .from(serviceProduct)
      .where(and(...conditions));
    
    return result.length;
  }
}
