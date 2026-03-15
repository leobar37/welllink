import {
  eq,
  and,
  like,
  ilike,
  desc,
  inArray,
  isNull,
  or,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import {
  product,
  type Product,
  type NewProduct,
} from "../../db/schema/product";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class ProductRepository {
  /**
   * Create a new product
   */
  async create(data: NewProduct) {
    const [result] = await db.insert(product).values(data).returning();
    return result;
  }

  /**
   * Find product by ID for a specific profile
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

    return db.query.product.findFirst({
      where: and(eq(product.id, id), inArray(product.profileId, profileIds)),
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Find product by ID and profile ID directly (for AI tools)
   */
  async findByIdAndProfile(id: string, profileId: string) {
    return db.query.product.findFirst({
      where: and(eq(product.id, id), eq(product.profileId, profileId)),
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Find all products for a profile
   */
  async findByProfileId(ctx: RequestContext, options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    supplierId?: string;
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
    const conditions = [inArray(product.profileId, profileIds)];

    if (options?.categoryId) {
      conditions.push(eq(product.categoryId, options.categoryId));
    }

    if (options?.supplierId) {
      conditions.push(eq(product.supplierId, options.supplierId));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(product.isActive, options.isActive));
    }

    return db.query.product.findMany({
      where: and(...conditions),
      orderBy: desc(product.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Find all products by profile ID directly (for AI tools)
   */
  async findByProfileIdDirect(profileId: string, options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const conditions = [eq(product.profileId, profileId)];

    if (options?.categoryId) {
      conditions.push(eq(product.categoryId, options.categoryId));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(product.isActive, options.isActive));
    }

    return db.query.product.findMany({
      where: and(...conditions),
      orderBy: desc(product.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Search products by name, SKU, or barcode directly (for AI tools)
   */
  async searchByNameOrSkuDirect(profileId: string, searchTerm: string, options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const searchPattern = `%${searchTerm}%`;
    
    const conditions = [
      eq(product.profileId, profileId),
      or(
        ilike(product.name, searchPattern),
        ilike(product.sku, searchPattern),
        ilike(product.barcode, searchPattern)
      ),
    ];

    if (options?.categoryId) {
      conditions.push(eq(product.categoryId, options.categoryId));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(product.isActive, options.isActive));
    }

    return db.query.product.findMany({
      where: and(...conditions),
      orderBy: desc(product.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Search products by name or SKU
   */
  async searchByNameOrSku(ctx: RequestContext, searchTerm: string, options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
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
    const searchPattern = `%${searchTerm}%`;
    
    const conditions = [
      inArray(product.profileId, profileIds),
      or(
        ilike(product.name, searchPattern),
        ilike(product.sku, searchPattern),
        ilike(product.barcode, searchPattern)
      ),
    ];

    if (options?.categoryId) {
      conditions.push(eq(product.categoryId, options.categoryId));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(product.isActive, options.isActive));
    }

    return db.query.product.findMany({
      where: and(...conditions),
      orderBy: desc(product.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Find product by SKU for a profile (for uniqueness validation)
   */
  async findBySku(ctx: RequestContext, sku: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.product.findFirst({
      where: and(eq(product.sku, sku), inArray(product.profileId, profileIds)),
    });
  }

  /**
   * Find product by SKU and profile ID directly (for AI tools)
   */
  async findBySkuAndProfile(sku: string, profileId: string) {
    return db.query.product.findFirst({
      where: and(eq(product.sku, sku), eq(product.profileId, profileId)),
    });
  }

  /**
   * Update a product
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewProduct>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(product)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(product.id, id), inArray(product.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Update product by ID and profile directly (for AI tools)
   */
  async updateByIdAndProfile(id: string, profileId: string, data: Partial<NewProduct>) {
    const [result] = await db
      .update(product)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(product.id, id), eq(product.profileId, profileId)))
      .returning();
    return result;
  }

  /**
   * Soft delete a product - sets deletedAt timestamp
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
      .update(product)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(product.id, id), inArray(product.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Hard delete a product - permanent deletion
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
      .delete(product)
      .where(and(eq(product.id, id), inArray(product.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Count products for a profile
   */
  async count(ctx: RequestContext, options?: {
    categoryId?: string;
    supplierId?: string;
    isActive?: boolean;
    searchTerm?: string;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return 0;
    }

    const profileIds = profiles.map((p) => p.id);
    
    // Start with profile condition
    let whereClause = and(inArray(product.profileId, profileIds));

    if (options?.categoryId) {
      whereClause = and(whereClause, eq(product.categoryId, options.categoryId));
    }

    if (options?.supplierId) {
      whereClause = and(whereClause, eq(product.supplierId, options.supplierId));
    }

    if (options?.isActive !== undefined) {
      whereClause = and(whereClause, eq(product.isActive, options.isActive));
    }

    if (options?.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      whereClause = and(
        whereClause,
        or(
          ilike(product.name, searchPattern),
          ilike(product.sku, searchPattern)
        )
      );
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(product)
      .where(whereClause);
    
    return result[0]?.count ?? 0;
  }
}
