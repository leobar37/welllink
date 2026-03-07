import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { agentConfig, profile } from "../../db/schema";
import type { RequestContext } from "../../types";
import type { NewAgentConfig, AgentConfig } from "../../db/schema/agent-config";

export class AgentConfigRepository {
  async findByProfile(ctx: RequestContext, profileId: string): Promise<AgentConfig | null> {
    // First verify user owns the profile
    const profileRecord = await db.query.profile.findFirst({
      where: and(eq(profile.id, profileId), eq(profile.userId, ctx.userId)),
    });

    if (!profileRecord) {
      return null;
    }

    const config = await db.query.agentConfig.findFirst({
      where: eq(agentConfig.profileId, profileId),
    });

    return config ?? null;
  }

  /**
   * Find agent config by profile ID without auth check
   * Used for public/agent access
   */
  async findByProfileId(profileId: string): Promise<AgentConfig | null> {
    const config = await db.query.agentConfig.findFirst({
      where: eq(agentConfig.profileId, profileId),
    });
    return config ?? null;
  }

  async findOne(ctx: RequestContext, id: string) {
    // First get the config
    const config = await db.query.agentConfig.findFirst({
      where: eq(agentConfig.id, id),
    });

    if (!config) {
      return null;
    }

    // Then verify the profile belongs to the user
    const profileRecord = await db.query.profile.findFirst({
      where: and(eq(profile.id, config.profileId), eq(profile.userId, ctx.userId)),
    });

    if (!profileRecord) {
      return null;
    }

    return config;
  }

  async create(ctx: RequestContext, data: NewAgentConfig) {
    // Verify user owns the profile
    const profileRecord = await db.query.profile.findFirst({
      where: and(
        eq(profile.id, data.profileId),
        eq(profile.userId, ctx.userId),
      ),
    });

    if (!profileRecord) {
      throw new Error("Profile not found or access denied");
    }

    const [created] = await db.insert(agentConfig).values(data).returning();
    return created;
  }

  async update(ctx: RequestContext, id: string, data: Partial<NewAgentConfig>) {
    // First verify ownership
    const existingConfig = await this.findOne(ctx, id);
    if (!existingConfig) {
      throw new Error("Agent config not found or access denied");
    }

    const [updated] = await db
      .update(agentConfig)
      .set(data)
      .where(eq(agentConfig.id, id))
      .returning();

    return updated;
  }

  async delete(ctx: RequestContext, id: string) {
    // First verify ownership
    const existingConfig = await this.findOne(ctx, id);
    if (!existingConfig) {
      throw new Error("Agent config not found or access denied");
    }

    await db.delete(agentConfig).where(eq(agentConfig.id, id));
    return true;
  }
}
