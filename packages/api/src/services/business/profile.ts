import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type { CreateProfileData, UpdateProfileData } from "../../types/dto";
import type {
  FeaturesConfig,
  FAQConfig,
  FAQItem,
} from "../../db/schema/profile";
import { ProfileRepository } from "../repository/profile";
import { AssetRepository } from "../repository/asset";
import { AnalyticsRepository } from "../repository/analytics";

export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private assetRepository: AssetRepository,
    private analyticsRepository: AnalyticsRepository,
  ) {}

  async getProfile(ctx: RequestContext, id: string) {
    const profile = await this.profileRepository.findOne(ctx, id);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  async getProfiles(ctx: RequestContext) {
    return this.profileRepository.findByUser(ctx, ctx.userId);
  }

  async getProfileByUsername(ctx: RequestContext, username: string) {
    const profile = await this.profileRepository.findByUsername(ctx, username);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Track view if not owner
    if (profile.userId !== ctx.userId) {
      await this.analyticsRepository.createProfileView({
        profileId: profile.id,
        source: "direct_link",
        userAgent: null,
      });
    }

    return profile;
  }

  async createProfile(ctx: RequestContext, data: CreateProfileData) {
    // Validate username uniqueness
    const existingProfile = await this.profileRepository.findByUsername(
      ctx,
      data.username,
    );
    if (existingProfile) {
      throw new ConflictException("Profile username already exists");
    }

    // Set default avatar if provided
    if (data.avatarId) {
      const avatar = await this.assetRepository.findOne(ctx, data.avatarId);
      if (!avatar) {
        throw new BadRequestException("Avatar not found");
      }
    }

    // Set default cover image if provided
    if (data.coverImageId) {
      const coverImage = await this.assetRepository.findOne(
        ctx,
        data.coverImageId,
      );
      if (!coverImage) {
        throw new BadRequestException("Cover image not found");
      }
    }

    return this.profileRepository.create(ctx, data);
  }

  async updateProfile(
    ctx: RequestContext,
    id: string,
    data: UpdateProfileData,
  ) {
    // Check if profile exists and user owns it
    const existingProfile = await this.profileRepository.findOne(ctx, id);
    if (!existingProfile) {
      throw new NotFoundException("Profile not found");
    }

    // If updating username, check uniqueness
    if (data.username && data.username !== existingProfile.username) {
      const existingUsername = await this.profileRepository.findByUsername(
        ctx,
        data.username,
      );
      if (existingUsername) {
        throw new ConflictException("Profile username already exists");
      }
    }

    // Validate avatar if provided
    if (data.avatarId) {
      const avatar = await this.assetRepository.findOne(ctx, data.avatarId);
      if (!avatar) {
        throw new BadRequestException("Avatar not found");
      }
    }

    // Validate cover image if provided
    if (data.coverImageId) {
      const coverImage = await this.assetRepository.findOne(
        ctx,
        data.coverImageId,
      );
      if (!coverImage) {
        throw new BadRequestException("Cover image not found");
      }
    }

    return this.profileRepository.update(ctx, id, data);
  }

  async deleteProfile(ctx: RequestContext, id: string) {
    // Check if profile exists and user owns it
    const profile = await this.profileRepository.findOne(ctx, id);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return this.profileRepository.delete(ctx, id);
  }

  async getProfileStats(ctx: RequestContext, profileId: string) {
    // Check if profile exists and user owns it
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const [viewCount, socialClicks] = await Promise.all([
      this.analyticsRepository.getProfileViewsCount(ctx, profileId),
      this.analyticsRepository.getSocialClicks(ctx, profileId),
    ]);

    return {
      views: viewCount,
      socialClicks: socialClicks.length,
    };
  }

  async updateFeaturesConfig(
    ctx: RequestContext,
    profileId: string,
    featuresConfig: FeaturesConfig,
  ) {
    // Check if profile exists and user owns it
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Merge with existing config
    const mergedConfig = {
      ...profile.featuresConfig,
      ...featuresConfig,
    };

    return this.profileRepository.update(ctx, profileId, {
      featuresConfig: mergedConfig,
    });
  }

  async getFAQConfig(
    ctx: RequestContext,
    profileId: string,
  ): Promise<FAQConfig> {
    // Check if profile exists and user owns it
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Return existing config or empty default
    return profile.faqConfig || { faqs: [] };
  }

  async updateFAQConfig(
    ctx: RequestContext,
    profileId: string,
    faqs: FAQItem[],
  ): Promise<FAQConfig> {
    // Check if profile exists and user owns it
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Validate FAQs array
    if (!Array.isArray(faqs)) {
      throw new BadRequestException("FAQs must be an array");
    }

    // Validate each FAQ item
    for (const faq of faqs) {
      if (!faq.id || typeof faq.id !== "string") {
        throw new BadRequestException("Each FAQ must have a valid id");
      }
      if (!faq.question || faq.question.trim().length < 5) {
        throw new BadRequestException(
          "FAQ question must be at least 5 characters",
        );
      }
      if (!faq.answer || faq.answer.trim().length < 10) {
        throw new BadRequestException(
          "FAQ answer must be at least 10 characters",
        );
      }
      if (!Array.isArray(faq.keywords) || faq.keywords.length === 0) {
        throw new BadRequestException("FAQ must have at least one keyword");
      }
      if (
        faq.keywords.some((k: string) => typeof k !== "string" || k.length < 2)
      ) {
        throw new BadRequestException(
          "Keywords must be strings with at least 2 characters",
        );
      }
    }

    // Check limits
    if (faqs.length > 50) {
      throw new BadRequestException("Maximum 50 FAQs allowed");
    }

    const config: FAQConfig = { faqs };

    await this.profileRepository.update(ctx, profileId, {
      faqConfig: config,
    });

    return config;
  }
}
