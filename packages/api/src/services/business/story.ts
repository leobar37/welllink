import {
  BadRequestException,
  NotFoundException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { StorySectionRepository } from "../repository/story-section";
import { StoryRepository } from "../repository/story";
import { StoryEventRepository } from "../repository/story-event";
import { ProfileRepository } from "../repository/profile";
import { AssetRepository } from "../repository/asset";
import { subDays, startOfDay, endOfDay } from "date-fns";

const MAX_PUBLISHED_STORIES = 3;

interface SectionPayload {
  title?: string;
  intro?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

interface StoryPayload {
  title: string;
  type: "self" | "client";
  beforeAssetId: string;
  afterAssetId: string;
  text?: string | null;
  isPublished?: boolean;
}

interface StoryUpdatePayload extends Partial<StoryPayload> {}

interface StoryEventPayload {
  profileId: string;
  storyId?: string;
  eventType: "section_viewed" | "story_changed" | "text_opened" | "cta_clicked";
  metadata?: Record<string, unknown>;
}

export class StoryService {
  constructor(
    private storySectionRepository: StorySectionRepository,
    private storyRepository: StoryRepository,
    private storyEventRepository: StoryEventRepository,
    private profileRepository: ProfileRepository,
    private assetRepository: AssetRepository,
  ) {}

  async getDashboardData(ctx: RequestContext, profileId: string) {
    await this.ensureProfileOwnership(ctx, profileId);

    const section =
      (await this.storySectionRepository.findByProfileId(profileId)) ||
      (await this.storySectionRepository.create(profileId, {}));
    const stories = await this.storyRepository.listByProfile(profileId);

    return { section, stories };
  }

  async upsertSection(
    ctx: RequestContext,
    profileId: string,
    payload: SectionPayload,
  ) {
    await this.ensureProfileOwnership(ctx, profileId);
    const existing = await this.storySectionRepository.findByProfileId(
      profileId,
    );

    if (existing) {
      return this.storySectionRepository.update(existing.id, payload);
    }

    return this.storySectionRepository.create(profileId, payload);
  }

  async createStory(
    ctx: RequestContext,
    profileId: string,
    payload: StoryPayload,
  ) {
    await this.ensureProfileOwnership(ctx, profileId);
    await this.validateAssets(ctx, payload.beforeAssetId, payload.afterAssetId);

    if (payload.isPublished) {
      await this.ensurePublishLimit(profileId);
    }

    const order = await this.storyRepository.getNextOrder(profileId);

    return this.storyRepository.create({
      profileId,
      title: payload.title,
      type: payload.type,
      beforeAssetId: payload.beforeAssetId,
      afterAssetId: payload.afterAssetId,
      text: payload.text ?? null,
      isPublished: payload.isPublished ?? false,
      order,
    });
  }

  async updateStory(ctx: RequestContext, storyId: string, payload: StoryUpdatePayload) {
    const existing = await this.storyRepository.findById(storyId);
    if (!existing) {
      throw new NotFoundException("Story not found");
    }

    await this.ensureProfileOwnership(ctx, existing.profileId);

    if (payload.beforeAssetId || payload.afterAssetId) {
      await this.validateAssets(
        ctx,
        payload.beforeAssetId ?? existing.beforeAssetId,
        payload.afterAssetId ?? existing.afterAssetId,
      );
    }

    if (payload.isPublished && !existing.isPublished) {
      await this.ensurePublishLimit(existing.profileId);
    }

    if (payload.isPublished === false && existing.isPublished) {
      // allow unpublish without extra checks
    }

    return this.storyRepository.update(storyId, payload);
  }

  async deleteStory(ctx: RequestContext, storyId: string) {
    const existing = await this.storyRepository.findById(storyId);
    if (!existing) {
      throw new NotFoundException("Story not found");
    }
    await this.ensureProfileOwnership(ctx, existing.profileId);
    return this.storyRepository.delete(storyId);
  }

  async reorderStories(
    ctx: RequestContext,
    profileId: string,
    items: Array<{ id: string; order: number }>,
  ) {
    await this.ensureProfileOwnership(ctx, profileId);
    return this.storyRepository.reorder(profileId, items);
  }

  async togglePublish(
    ctx: RequestContext,
    storyId: string,
    isPublished: boolean,
  ) {
    const existing = await this.storyRepository.findById(storyId);
    if (!existing) {
      throw new NotFoundException("Story not found");
    }

    await this.ensureProfileOwnership(ctx, existing.profileId);

    if (isPublished && !existing.isPublished) {
      await this.ensurePublishLimit(existing.profileId);
      await this.validateAssets(
        ctx,
        existing.beforeAssetId,
        existing.afterAssetId,
      );
    }

    return this.storyRepository.update(storyId, { isPublished });
  }

  async getPublicStories(profileId: string) {
    const [section, stories] = await Promise.all([
      this.storySectionRepository.findByProfileId(profileId),
      this.storyRepository.listPublishedByProfile(profileId),
    ]);

    if (!section || stories.length === 0) {
      return null;
    }

    return {
      section,
      stories,
    };
  }

  async getPublicStoriesByUsername(username: string) {
    const guestCtx: RequestContext = { userId: "", email: "", role: "guest" };
    const profile = await this.profileRepository.findByUsername(
      guestCtx,
      username,
    );
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const stories = await this.getPublicStories(profile.id);
    return { profile, stories };
  }

  async trackEvent(payload: StoryEventPayload) {
    return this.storyEventRepository.record({
      profileId: payload.profileId,
      storyId: payload.storyId ?? null,
      eventType: payload.eventType,
      metadata: payload.metadata ?? null,
    });
  }

  async getStoryMetrics(
    ctx: RequestContext,
    profileId: string,
    days: number = 30,
  ) {
    await this.ensureProfileOwnership(ctx, profileId);
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());
    const counts = await this.storyEventRepository.getEventCounts(
      profileId,
      startDate,
      endDate,
    );

    const mapped = counts.reduce(
      (acc: Record<string, number>, row) => {
        acc[row.eventType] = Number(row.count) || 0;
        return acc;
      },
      {},
    );

    return {
      counts: mapped,
      period: { days, startDate, endDate },
    };
  }

  private async ensureProfileOwnership(ctx: RequestContext, profileId: string) {
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private async validateAssets(
    ctx: RequestContext,
    beforeAssetId: string,
    afterAssetId: string,
  ) {
    const [before, after] = await Promise.all([
      this.assetRepository.findOne(ctx, beforeAssetId),
      this.assetRepository.findOne(ctx, afterAssetId),
    ]);

    if (!before || !after) {
      throw new BadRequestException(
        "Both before and after images must belong to the advisor",
      );
    }
  }

  private async ensurePublishLimit(profileId: string) {
    const publishedCount = await this.storyRepository.countPublished(profileId);
    if (publishedCount >= MAX_PUBLISHED_STORIES) {
      throw new BadRequestException(
        `Solo puedes tener ${MAX_PUBLISHED_STORIES} historias publicadas`,
      );
    }
  }
}
