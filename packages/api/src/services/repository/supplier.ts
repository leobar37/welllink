import {
  eq,
  and,
  like,
  ilike,
  desc,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import {
  supplier,
  type Supplier,
  type NewSupplier,
} from "../../db/schema/supplier";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class SupplierRepository {
  /**
   * Create a new supplier
   */
  async create(data: NewSupplier) {
    const [result] = await db.insert(supplier).values(data).returning();
    return result;
  }

  /**
   * Find supplier by ID
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

    return db.query.supplier.findFirst({
      where: and(eq(supplier.id, id), inArray(supplier.profileId, profileIds)),
    });
  }

  /**
   * Find supplier by ID and profile directly (for AI tools)
   */
  async findByIdAndProfile(id: string, profileId: string) {
    return db.query.supplier.findFirst({
      where: and(eq(supplier.id, id), eq(supplier.profileId, profileId)),
    });
  }

  /**
   * Find all suppliers for a profile
   */
  async findByProfileId(ctx: RequestContext, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
    searchTerm?: string;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [inArray(supplier.profileId, profileIds)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplier.isActive, options.isActive));
    }

    if (options?.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      conditions.push(
        ilike(supplier.name, searchPattern)
      );
    }

    return db.query.supplier.findMany({
      where: and(...conditions),
      orderBy: desc(supplier.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find all suppliers by profile ID directly (for AI tools)
   */
  async findByProfileIdDirect(profileId: string, options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }) {
    const conditions = [eq(supplier.profileId, profileId)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplier.isActive, options.isActive));
    }

    return db.query.supplier.findMany({
      where: and(...conditions),
      orderBy: desc(supplier.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Search suppliers by name
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
      inArray(supplier.profileId, profileIds),
      ilike(supplier.name, searchPattern),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplier.isActive, options.isActive));
    }

    return db.query.supplier.findMany({
      where: and(...conditions),
      orderBy: desc(supplier.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find supplier by email for a profile
   */
  async findByEmail(ctx: RequestContext, email: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.supplier.findFirst({
      where: and(
        eq(supplier.email, email),
        inArray(supplier.profileId, profileIds)
      ),
    });
  }

  /**
   * Update a supplier
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewSupplier>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(supplier)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(supplier.id, id), inArray(supplier.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Update supplier by ID and profile directly (for AI tools)
   */
  async updateByIdAndProfile(id: string, profileId: string, data: Partial<NewSupplier>) {
    const [result] = await db
      .update(supplier)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(supplier.id, id), eq(supplier.profileId, profileId)))
      .returning();
    return result;
  }

  /**
   * Soft delete a supplier - sets isActive to false
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
      .update(supplier)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(supplier.id, id), inArray(supplier.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Hard delete a supplier - permanent deletion
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
      .delete(supplier)
      .where(and(eq(supplier.id, id), inArray(supplier.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Count suppliers for a profile
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
    const conditions = [inArray(supplier.profileId, profileIds)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(supplier.isActive, options.isActive));
    }

    if (options?.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      conditions.push(ilike(supplier.name, searchPattern));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplier)
      .where(and(...conditions));
    
    return result[0]?.count ?? 0;
  }
}
