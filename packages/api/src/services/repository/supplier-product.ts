import {
  eq,
  and,
  desc,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import {
  supplierProduct,
  type SupplierProduct,
  type NewSupplierProduct,
} from "../../db/schema/supplier-product";
import { product, type Product } from "../../db/schema/product";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

/**
 * Extended type for supplier product with product details
 */
export interface SupplierProductWithProduct extends SupplierProduct {
  product: Product;
}

export class SupplierProductRepository {
  /**
   * Create a new supplier-product association
   */
  async create(data: NewSupplierProduct) {
    const [result] = await db.insert(supplierProduct).values(data).returning();
    return result;
  }

  /**
   * Find supplier-product by ID
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

    return db.query.supplierProduct.findFirst({
      where: and(
        eq(supplierProduct.id, id),
        inArray(supplierProduct.profileId, profileIds)
      ),
    });
  }

  /**
   * Find supplier-product by ID and profile directly (for API routes)
   */
  async findByIdAndProfile(id: string, profileId: string): Promise<SupplierProduct | null> {
    const result = await db.query.supplierProduct.findFirst({
      where: and(
        eq(supplierProduct.id, id),
        eq(supplierProduct.profileId, profileId)
      ),
    });
    return result ?? null;
  }

  /**
   * Find all products for a supplier
   */
  async findBySupplierId(ctx: RequestContext, supplierId: string, options?: {
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
      eq(supplierProduct.supplierId, supplierId),
      inArray(supplierProduct.profileId, profileIds),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    return db.query.supplierProduct.findMany({
      where: and(...conditions),
      orderBy: desc(supplierProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all products for a supplier by profile directly
   */
  async findBySupplierIdAndProfile(supplierId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [
      eq(supplierProduct.supplierId, supplierId),
      eq(supplierProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    return db.query.supplierProduct.findMany({
      where: and(...conditions),
      orderBy: desc(supplierProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all suppliers for a product
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
      eq(supplierProduct.productId, productId),
      inArray(supplierProduct.profileId, profileIds),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    return db.query.supplierProduct.findMany({
      where: and(...conditions),
      orderBy: desc(supplierProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all suppliers for a product by profile directly
   */
  async findByProductIdAndProfile(productId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [
      eq(supplierProduct.productId, productId),
      eq(supplierProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    return db.query.supplierProduct.findMany({
      where: and(...conditions),
      orderBy: desc(supplierProduct.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find primary supplier for a product
   */
  async findPrimaryByProductIdAndProfile(productId: string, profileId: string): Promise<SupplierProduct | null> {
    const result = await db.query.supplierProduct.findFirst({
      where: and(
        eq(supplierProduct.productId, productId),
        eq(supplierProduct.profileId, profileId),
        eq(supplierProduct.isPrimary, true),
        eq(supplierProduct.isActive, true)
      ),
    });
    return result ?? null;
  }

  /**
   * Find all products for a supplier with product details
   */
  async findBySupplierIdWithProduct(supplierId: string, profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }): Promise<SupplierProductWithProduct[]> {
    const conditions = [
      eq(supplierProduct.supplierId, supplierId),
      eq(supplierProduct.profileId, profileId),
    ];
    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    const results = await db.select()
      .from(supplierProduct)
      .leftJoin(product, eq(supplierProduct.productId, product.id))
      .where(and(...conditions))
      .orderBy(desc(supplierProduct.createdAt))
      .limit(options?.limit ?? 100)
      .offset(options?.offset ?? 0);

    return results.map((r) => ({
      ...r.supplier_product,
      product: r.product!,
    }));
  }

  /**
   * Check if supplier-product association exists
   */
  async exists(supplierId: string, productId: string, profileId: string) {
    const existing = await db.query.supplierProduct.findFirst({
      where: and(
        eq(supplierProduct.supplierId, supplierId),
        eq(supplierProduct.productId, productId),
        eq(supplierProduct.profileId, profileId)
      ),
    });
    return !!existing;
  }

  /**
   * Update supplier-product association
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewSupplierProduct>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(supplierProduct)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.id, id),
        inArray(supplierProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Update supplier-product by ID and profile directly
   */
  async updateByIdAndProfile(id: string, profileId: string, data: Partial<NewSupplierProduct>) {
    const [result] = await db
      .update(supplierProduct)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.id, id),
        eq(supplierProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Set a supplier as primary for a product (unsets other primaries)
   */
  async setPrimary(supplierProductId: string, profileId: string) {
    // First, get the product ID for this association
    const assoc = await db.query.supplierProduct.findFirst({
      where: eq(supplierProduct.id, supplierProductId),
    });
    
    if (!assoc) {
      throw new Error("Supplier product association not found");
    }
    
    // Unset all primary flags for this product
    await db
      .update(supplierProduct)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.profileId, profileId),
        eq(supplierProduct.productId, assoc.productId),
        eq(supplierProduct.isPrimary, true)
      ));

    // Then set this one as primary
    const [result] = await db
      .update(supplierProduct)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.id, supplierProductId),
        eq(supplierProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Soft delete supplier-product association
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
      .update(supplierProduct)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.id, id),
        inArray(supplierProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Soft delete by ID and profile directly
   */
  async deleteByIdAndProfile(id: string, profileId: string) {
    const [result] = await db
      .update(supplierProduct)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(supplierProduct.id, id),
        eq(supplierProduct.profileId, profileId)
      ))
      .returning();
    return result;
  }

  /**
   * Hard delete supplier-product association
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
      .delete(supplierProduct)
      .where(and(
        eq(supplierProduct.id, id),
        inArray(supplierProduct.profileId, profileIds)
      ))
      .returning();
    return result;
  }

  /**
   * Count products for a supplier
   */
  async countBySupplierId(supplierId: string, profileId: string, options?: {
    isActive?: boolean;
  }) {
    const conditions = [
      eq(supplierProduct.supplierId, supplierId),
      eq(supplierProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplierProduct)
      .where(and(...conditions));
    
    return result[0]?.count ?? 0;
  }

  /**
   * Count suppliers for a product
   */
  async countByProductId(productId: string, profileId: string, options?: {
    isActive?: boolean;
  }) {
    const conditions = [
      eq(supplierProduct.productId, productId),
      eq(supplierProduct.profileId, profileId),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplierProduct.isActive, options.isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplierProduct)
      .where(and(...conditions));
    
    return result[0]?.count ?? 0;
  }
}
