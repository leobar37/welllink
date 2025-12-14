import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  clientNote,
  type ClientNote,
  type NewClientNote,
} from "../../db/schema/client-note";
import { client } from "../../db/schema/client";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";

export class ClientNoteRepository {
  async create(data: NewClientNote) {
    const [result] = await db.insert(clientNote).values(data).returning();
    return result;
  }

  async findByClientId(ctx: RequestContext, clientId: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.clientNote.findMany({
      where: and(
        eq(clientNote.clientId, clientId),
        inArray(clientNote.profileId, profileIds),
      ),
      orderBy: desc(clientNote.createdAt),
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

    return db.query.clientNote.findFirst({
      where: and(eq(clientNote.id, id), inArray(clientNote.profileId, profileIds)),
    });
  }

  async update(ctx: RequestContext, id: string, data: Partial<NewClientNote>) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileIds = profiles.map((p) => p.id);

    const [result] = await db
      .update(clientNote)
      .set(data)
      .where(and(eq(clientNote.id, id), inArray(clientNote.profileId, profileIds)))
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
      .delete(clientNote)
      .where(and(eq(clientNote.id, id), inArray(clientNote.profileId, profileIds)))
      .returning();
    return result;
  }
}
