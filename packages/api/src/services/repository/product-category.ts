import {
  eq,
  and,
  like,
  ilike,
  desc,
  inArray,
  sql,
  asc,
} from "drizzle-orm";
import { db } from "../../db";
import {
  productCategory,
  type ProductCategory,
  type NewProductCategory,
} from "../../db/schema/product-category";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class ProductCategoryRepository {
  /**
   * Create a new product category
   */
  async create(data: NewProductCategory) {
    const [result] = await db.insert(productCategory).values(data).returning();
    return result;
  }

  /**
   * Find category by ID
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

    return db.query.productCategory.findFirst({
      where: and(
        eq(productCategory.id, id),
        inArray(productCategory.profileId, profileIds)
      ),
    });
  }

  /**
   * Find category by ID and profile directly (for AI tools)
   */
  async findByIdAndProfile(id: string, profileId: string) {
    return db.query.productCategory.findFirst({
      where: and(
        eq(productCategory.id, id),
        eq(productCategory.profileId, profileId)
      ),
    });
  }

  /**
   * Find all categories for a profile
   */
  async findByProfileId(ctx: RequestContext, options?: {
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
    const conditions = [inArray(productCategory.profileId, profileIds)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(productCategory.isActive, options.isActive));
    }

    return db.query.productCategory.findMany({
      where: and(...conditions),
      orderBy: [asc(productCategory.sortOrder), desc(productCategory.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all categories by profile ID directly (for AI tools)
   */
  async findByProfileIdDirect(profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [eq(productCategory.profileId, profileId)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(productCategory.isActive, options.isActive));
    }

    return db.query.productCategory.findMany({
      where: and(...conditions),
      orderBy: [asc(productCategory.sortOrder), desc(productCategory.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Search categories by name
   */
  async searchByName(ctx: RequestContext, searchTerm: string, options?: {
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
    const searchPattern = `%${searchTerm}%`;
    
    const conditions = [
      inArray(productCategory.profileId, profileIds),
      ilike(productCategory.name, searchPattern),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(productCategory.isActive, options.isActive));
    }

    return db.query.productCategory.findMany({
      where: and(...conditions),
      orderBy: [asc(productCategory.sortOrder), desc(productCategory.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find category by name for a profile (for uniqueness validation)
   */
  async findByName(ctx: RequestContext, name: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.productCategory.findFirst({
      where: and(
        eq(productCategory.name, name),
        inArray(productCategory.profileId, profileIds)
      ),
    });
  }

  /**
   * Update a category
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewProductCategory>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(productCategory)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(productCategory.id, id),
          inArray(productCategory.profileId, profileIds)
        )
      )
      .returning();
    return result;
  }

  /**
   * Update category by ID and profile directly (for AI tools)
   */
  async updateByIdAndProfile(id: string, profileId: string, data: Partial<NewProductCategory>) {
    const [result] = await db
      .update(productCategory)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(productCategory.id, id),
          eq(productCategory.profileId, profileId)
        )
      )
      .returning();
    return result;
  }

  /**
   * Soft delete a category - sets isActive to false
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
      .update(productCategory)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(productCategory.id, id),
          inArray(productCategory.profileId, profileIds)
        )
      )
      .returning();
    return result;
  }

  /**
   * Hard delete a category - permanent deletion
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
      .delete(productCategory)
      .where(
        and(
          eq(productCategory.id, id),
          inArray(productCategory.profileId, profileIds)
        )
      )
      .returning();
    return result;
  }

  /**
   * Count categories for a profile
   */
  async count(ctx: RequestContext, options?: {
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
    const conditions = [inArray(productCategory.profileId, profileIds)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(productCategory.isActive, options.isActive));
    }

    if (options?.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      conditions.push(ilike(productCategory.name, searchPattern));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCategory)
      .where(and(...conditions));
    
    return result[0]?.count ?? 0;
  }
}
