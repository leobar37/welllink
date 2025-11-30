import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type {
  CreateSocialLinkData,
  UpdateSocialLinkData,
} from "../../types/dto";
import { SocialLinkRepository } from "../repository/social-link";
import { AnalyticsRepository } from "../repository/analytics";

export class SocialLinkService {
  constructor(
    private socialLinkRepository: SocialLinkRepository,
    private analyticsRepository: AnalyticsRepository,
  ) {}

  async getSocialLinks(ctx: RequestContext, profileId: string) {
    return this.socialLinkRepository.findByProfile(ctx, profileId);
  }

  async getSocialLink(ctx: RequestContext, id: string) {
    const socialLink = await this.socialLinkRepository.findOne(ctx, id);
    if (!socialLink) {
      throw new NotFoundException("Social link not found");
    }
    return socialLink;
  }

  async createSocialLink(ctx: RequestContext, data: CreateSocialLinkData) {
    // Validate required fields
    if (!data.profileId || !data.platform || !data.url) {
      throw new BadRequestException(
        "Missing required fields: profileId, platform, url",
      );
    }

    // Validate URL format
    try {
      new URL(data.url);
    } catch {
      throw new BadRequestException("Invalid URL format");
    }

    return this.socialLinkRepository.create(ctx, data);
  }

  async updateSocialLink(
    ctx: RequestContext,
    id: string,
    data: UpdateSocialLinkData,
  ) {
    // Check if social link exists and user owns it
    const existingLink = await this.socialLinkRepository.findOne(ctx, id);
    if (!existingLink) {
      throw new NotFoundException("Social link not found");
    }

    // Validate URL if provided
    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        throw new BadRequestException("Invalid URL format");
      }
    }

    return this.socialLinkRepository.update(ctx, id, data);
  }

  async deleteSocialLink(ctx: RequestContext, id: string) {
    // Check if social link exists and user owns it
    const socialLink = await this.socialLinkRepository.findOne(ctx, id);
    if (!socialLink) {
      throw new NotFoundException("Social link not found");
    }

    return this.socialLinkRepository.delete(ctx, id);
  }

  async trackSocialClick(ctx: RequestContext, socialLinkId: string) {
    const socialLink = await this.socialLinkRepository.findOne(
      ctx,
      socialLinkId,
    );
    if (!socialLink) {
      throw new NotFoundException("Social link not found");
    }

    return this.analyticsRepository.createSocialClick({
      socialLinkId,
    });
  }

  async getSocialClickStats(ctx: RequestContext, profileId: string) {
    const socialClicks = await this.analyticsRepository.getSocialClicks(
      ctx,
      profileId,
    );

    // Group clicks by platform (via socialLink relation)
    const stats = socialClicks.reduce((acc: Record<string, number>, click) => {
      const platform = click.socialLink.platform;
      if (!acc[platform]) {
        acc[platform] = 0;
      }
      acc[platform]++;
      return acc;
    }, {});

    return {
      totalClicks: socialClicks.length,
      clicksByPlatform: stats,
    };
  }

  async reorderSocialLinks(
    ctx: RequestContext,
    profileId: string,
    linkIds: string[],
  ) {
    // Verify all links belong to the same profile and user has access
    for (const linkId of linkIds) {
      const link = await this.socialLinkRepository.findOne(ctx, linkId);
      if (!link || link.profileId !== profileId) {
        throw new NotFoundException("Social link not found or access denied");
      }
    }

    // Update order for each link
    const updates = linkIds.map((linkId, index) =>
      this.socialLinkRepository.update(ctx, linkId, { displayOrder: index }),
    );

    await Promise.all(updates);

    return this.socialLinkRepository.findByProfile(ctx, profileId);
  }
}
