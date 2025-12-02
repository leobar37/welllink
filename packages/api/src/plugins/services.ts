import { Elysia } from "elysia";
import {
  createStorageStrategy,
  type StorageStrategy,
} from "../services/storage";
import { AssetRepository } from "../services/repository/asset";
import { ProfileRepository } from "../services/repository/profile";
import { SocialLinkRepository } from "../services/repository/social-link";
import { HealthSurveyRepository } from "../services/repository/health-survey";
import { AIRecommendationRepository } from "../services/repository/ai-recommendation";
import { AnalyticsRepository } from "../services/repository/analytics";
import { StorySectionRepository } from "../services/repository/story-section";
import { StoryRepository } from "../services/repository/story";
import { StoryEventRepository } from "../services/repository/story-event";
import { AssetService } from "../services/business/asset";
import { CDNService } from "../services/business/cdn";
import { ProfileService } from "../services/business/profile";
import { SocialLinkService } from "../services/business/social-link";
import { HealthSurveyService } from "../services/business/health-survey";
import { AIRecommendationService } from "../services/business/ai-recommendation";
import { AnalyticsService } from "../services/business/analytics";
import { StoryService } from "../services/business/story";

let storageInstance: StorageStrategy | null = null;
let initialized = false;

async function getStorageInstance(): Promise<StorageStrategy> {
  if (!storageInstance) {
    storageInstance = await createStorageStrategy();
    if (!initialized) {
      await storageInstance.initialize();
      initialized = true;
    }
  }
  return storageInstance;
}

export const servicesPlugin = new Elysia({ name: "services" }).derive(
  { as: "global" },
  async () => {
    const storage = await getStorageInstance();

    // Repositories
    const assetRepository = new AssetRepository();
    const profileRepository = new ProfileRepository();
    const socialLinkRepository = new SocialLinkRepository();
    const healthSurveyRepository = new HealthSurveyRepository();
    const aiRecommendationRepository = new AIRecommendationRepository();
    const analyticsRepository = new AnalyticsRepository();
    const storySectionRepository = new StorySectionRepository();
    const storyRepository = new StoryRepository();
    const storyEventRepository = new StoryEventRepository();

    // Services
    const assetService = new AssetService(assetRepository, storage);
    const cdnService = new CDNService(assetRepository, storage);
    const profileService = new ProfileService(
      profileRepository,
      assetRepository,
      analyticsRepository,
    );
    const socialLinkService = new SocialLinkService(
      socialLinkRepository,
      analyticsRepository,
    );
    const healthSurveyService = new HealthSurveyService(healthSurveyRepository);
    const aiRecommendationService = new AIRecommendationService(
      aiRecommendationRepository,
      healthSurveyRepository
    );
    const analyticsService = new AnalyticsService(analyticsRepository);
    const storyService = new StoryService(
      storySectionRepository,
      storyRepository,
      storyEventRepository,
      profileRepository,
      assetRepository,
    );

    return {
      services: {
        storage,
        // Repositories
        assetRepository,
        profileRepository,
        socialLinkRepository,
        healthSurveyRepository,
        aiRecommendationRepository,
        analyticsRepository,
        storySectionRepository,
        storyRepository,
        storyEventRepository,
        // Services
        assetService,
        cdnService,
        profileService,
        socialLinkService,
        healthSurveyService,
        aiRecommendationService,
        analyticsService,
        storyService,
      },
    };
  },
);
