import { eq, and, like, desc, gte, lte, inArray, or, isNull } from "drizzle-orm";
import { db } from "../../db";
import { client, type Client, type NewClient } from "../../db/schema/client";
import { profile } from "../../db/schema/profile";
import type { ClientLabel } from "../../db/schema/client";
import type { RequestContext } from "../../types/context";

export class ClientRepository {
  async create(data: NewClient) {
    const [result] = await db.insert(client).values(data).returning();
    return result;
  }

  async findByUser(ctx: RequestContext) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.client.findMany({
      where: inArray(client.profileId, profileIds),
      orderBy: desc(client.createdAt),
    });
  }

  async findById(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.client.findFirst({
      where: and(eq(client.id, id), inArray(client.profileId, profileIds)),
    });
  }

  async update(ctx: RequestContext, id: string, data: Partial<NewClient>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(client)
      .set(data)
      .where(and(eq(client.id, id), inArray(client.profileId, profileIds)))
      .returning();
    return result;
  }

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
      .delete(client)
      .where(and(eq(client.id, id), inArray(client.profileId, profileIds)))
      .returning();
    return result;
  }

  async findByPhone(ctx: RequestContext, phone: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.client.findFirst({
      where: and(
        eq(client.phone, phone),
        inArray(client.profileId, profileIds),
      ),
    });
  }

  async getByLabel(ctx: RequestContext, label: ClientLabel) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.client.findMany({
      where: and(eq(client.label, label), inArray(client.profileId, profileIds)),
      orderBy: desc(client.createdAt),
    });
  }

  async getWithoutRecentContact(ctx: RequestContext, daysSince: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);

    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.client.findMany({
      where: and(
        inArray(client.profileId, profileIds),
        or(isNull(client.lastContactAt), lte(client.lastContactAt, cutoffDate)),
      ),
      orderBy: desc(client.createdAt),
    });
  }
}
