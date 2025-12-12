import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { whatsappConfig, profile } from "../../db/schema";
import type { RequestContext } from "../../types/context";

export class WhatsAppConfigRepository {
  async findByProfile(ctx: RequestContext, profileId: string) {
    // First verify user owns the profile
    const profileRecord = await db.query.profile.findFirst({
      where: and(
        eq(profile.id, profileId),
        eq(profile.userId, ctx.userId)
      ),
    });

    if (!profileRecord) {
      return [];
    }

    return db.query.whatsappConfig.findMany({
      where: eq(whatsappConfig.profileId, profileId),
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const config = await db.query.whatsappConfig.findFirst({
      where: eq(whatsappConfig.id, id),
      with: {
        profile: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own configs
    if (config?.profile.userId !== ctx.userId) {
      return null;
    }

    return config;
  }

  async findByInstanceName(ctx: RequestContext, instanceName: string) {
    const config = await db.query.whatsappConfig.findFirst({
      where: eq(whatsappConfig.instanceName, instanceName),
      with: {
        profile: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own configs
    if (config?.profile.userId !== ctx.userId) {
      return null;
    }

    return config;
  }

  async findByInstanceId(ctx: RequestContext, instanceId: string) {
    const config = await db.query.whatsappConfig.findFirst({
      where: eq(whatsappConfig.instanceId, instanceId),
      with: {
        profile: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own configs
    if (config?.profile.userId !== ctx.userId) {
      return null;
    }

    return config;
  }

  async create(ctx: RequestContext, data: Omit<typeof whatsappConfig.$inferInsert, "userId">) {
    // Verify user owns the profile
    const profileRecord = await db.query.profile.findFirst({
      where: and(
        eq(profile.id, data.profileId),
        eq(profile.userId, ctx.userId)
      ),
    });

    if (!profileRecord) {
      throw new Error("Profile not found or access denied");
    }

    const [config] = await db
      .insert(whatsappConfig)
      .values(data)
      .returning();

    return config;
  }

  async update(ctx: RequestContext, id: string, data: Partial<typeof whatsappConfig.$inferInsert>) {
    // First verify ownership
    const existingConfig = await this.findOne(ctx, id);
    if (!existingConfig) {
      throw new Error("Config not found or access denied");
    }

    const [config] = await db
      .update(whatsappConfig)
      .set(data)
      .where(eq(whatsappConfig.id, id))
      .returning();

    return config;
  }

  async delete(ctx: RequestContext, id: string) {
    // First verify ownership
    const existingConfig = await this.findOne(ctx, id);
    if (!existingConfig) {
      throw new Error("Config not found or access denied");
    }

    const [config] = await db
      .delete(whatsappConfig)
      .where(eq(whatsappConfig.id, id))
      .returning();

    return config;
  }

  async updateConnectionStatus(ctx: RequestContext, instanceId: string, isConnected: boolean, phone?: string) {
    // First verify ownership
    const existingConfig = await this.findByInstanceId(ctx, instanceId);
    if (!existingConfig) {
      throw new Error("Config not found or access denied");
    }

    const [config] = await db
      .update(whatsappConfig)
      .set({
        isConnected,
        phone,
        lastActivityAt: new Date(),
      })
      .where(eq(whatsappConfig.instanceId, instanceId))
      .returning();

    return config;
  }

  async getActiveConfigs(ctx: RequestContext) {
    // Get all profiles for the user
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    const profileIds = profiles.map(p => p.id);

    if (profileIds.length === 0) {
      return [];
    }

    return db.query.whatsappConfig.findMany({
      where: and(
        eq(whatsappConfig.isEnabled, true),
        // profileId is in the user's profiles
        db.sql`profile_id = ANY(${profileIds})`
      ),
    });
  }

  async getConversationList(configId: string) {
    return db.query.whatsappConfig.findFirst({
      where: eq(whatsappConfig.id, configId),
      with: {
        messages: {
          columns: {
            from: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });
  }
}