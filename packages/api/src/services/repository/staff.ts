import { eq, and, inArray, desc, isNull } from "drizzle-orm";
import { db } from "../../db";
import { staff, type Staff, type NewStaff } from "../../db/schema/staff";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class StaffRepository {
  /**
   * Create a new staff member
   */
  async create(data: NewStaff) {
    const [result] = await db.insert(staff).values(data).returning();
    return result;
  }

  /**
   * Get all staff members for a user's profiles
   */
  async findByUser(ctx: RequestContext) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.staff.findMany({
      where: inArray(staff.profileId, profileIds),
      orderBy: desc(staff.createdAt),
    });
  }

  /**
   * Get all staff members for a specific profile
   */
  async findByProfileId(profileId: string) {
    return db.query.staff.findMany({
      where: eq(staff.profileId, profileId),
      orderBy: desc(staff.createdAt),
    });
  }

  /**
   * Get active staff members for a specific profile
   */
  async findActiveByProfileId(profileId: string) {
    return db.query.staff.findMany({
      where: and(
        eq(staff.profileId, profileId),
        eq(staff.isActive, true)
      ),
      orderBy: desc(staff.createdAt),
    });
  }

  /**
   * Get a single staff member by ID for a user's profiles
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

    return db.query.staff.findFirst({
      where: and(eq(staff.id, id), inArray(staff.profileId, profileIds)),
    });
  }

  /**
   * Get a single staff member by ID for a specific profile (without user context)
   */
  async findByIdAndProfile(id: string, profileId: string) {
    return db.query.staff.findFirst({
      where: and(eq(staff.id, id), eq(staff.profileId, profileId)),
    });
  }

  /**
   * Update a staff member
   */
  async update(ctx: RequestContext, id: string, data: Partial<NewStaff>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Perfil no encontrado");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(staff)
      .set(data)
      .where(and(eq(staff.id, id), inArray(staff.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Update a staff member by profile ID (without user context)
   */
  async updateByProfile(id: string, profileId: string, data: Partial<NewStaff>) {
    const [result] = await db
      .update(staff)
      .set(data)
      .where(and(eq(staff.id, id), eq(staff.profileId, profileId)))
      .returning();
    return result;
  }

  /**
   * Delete (soft delete) a staff member
   */
  async delete(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Perfil no encontrado");
    }

    const profileIds = profiles.map((p) => p.id);

    // Soft delete - set isActive to false
    const [result] = await db
      .update(staff)
      .set({ isActive: false })
      .where(and(eq(staff.id, id), inArray(staff.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Hard delete a staff member (use with caution)
   */
  async hardDelete(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Perfil no encontrado");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .delete(staff)
      .where(and(eq(staff.id, id), inArray(staff.profileId, profileIds)))
      .returning();
    return result;
  }

  /**
   * Find staff by email within a profile
   */
  async findByEmail(profileId: string, email: string) {
    return db.query.staff.findFirst({
      where: and(eq(staff.profileId, profileId), eq(staff.email, email)),
    });
  }

  /**
   * Find staff by phone within a profile
   */
  async findByPhone(profileId: string, phone: string) {
    return db.query.staff.findFirst({
      where: and(eq(staff.profileId, profileId), eq(staff.phone, phone)),
    });
  }
}
