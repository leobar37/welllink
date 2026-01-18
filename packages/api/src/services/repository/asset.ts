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

  // Método para acceso público sin filtro de userId
  async findById(id: string) {
    const result = await db.query.asset.findFirst({
      where: eq(asset.id, id),
    });

    return result;
  }

  async findByUser(ctx: RequestContext, userId?: string) {
    return db.query.asset.findMany({
      where: eq(asset.userId, userId || ctx.userId),
      orderBy: (table) => table.createdAt,
    });
  }

  async update(
    ctx: RequestContext,
    id: string,
    data: Partial<AssetInsertWithoutUser>,
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
