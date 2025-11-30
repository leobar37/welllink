import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { asset } from "../../db/schema";
import type { RequestContext } from "../../types/context";

type AssetInsert = typeof asset.$inferInsert;
type AssetInsertWithoutUser = Omit<AssetInsert, "userId">;

export class AssetRepository {
  async create(ctx: RequestContext, data: AssetInsertWithoutUser) {
    const [result] = await db
      .insert(asset)
      .values({
        ...data,
        userId: ctx.userId,
      })
      .returning();

    return result;
  }

  async findOne(ctx: RequestContext, id: string) {
    const result = await db.query.asset.findFirst({
      where: and(eq(asset.id, id), eq(asset.userId, ctx.userId)),
    });

    return result;
  }

  async findByUser(ctx: RequestContext, userId?: string) {
    return db.query.asset.findMany({
      where: eq(asset.userId, userId || ctx.userId),
      orderBy: (table) => table.createdAt,
    });
  }

  async findByType(_ctx: RequestContext, _type: string) {
    // Note: The 'type' field doesn't exist in the current schema
    // This method needs schema update to work properly
    return db.query.asset.findMany({
      orderBy: (table) => table.createdAt,
    });
  }

  async update(
    ctx: RequestContext,
    id: string,
    data: Partial<AssetInsertWithoutUser>
  ) {
    const [result] = await db
      .update(asset)
      .set(data)
      .where(and(eq(asset.id, id), eq(asset.userId, ctx.userId)))
      .returning();

    return result;
  }

  async delete(ctx: RequestContext, id: string) {
    const [result] = await db
      .delete(asset)
      .where(and(eq(asset.id, id), eq(asset.userId, ctx.userId)))
      .returning();

    return result;
  }

  async findByPath(ctx: RequestContext, path: string) {
    const result = await db.query.asset.findFirst({
      where: and(eq(asset.path, path), eq(asset.userId, ctx.userId)),
    });

    return result;
  }

  async createIfNotExists(ctx: RequestContext, data: AssetInsertWithoutUser) {
    // Check if asset with same path already exists
    const existing = await this.findByPath(ctx, data.path);
    if (existing) {
      return existing;
    }

    return this.create(ctx, data);
  }
}
