import { Elysia } from "elysia";
import {
  createStorageStrategy,
  type StorageStrategy,
} from "../services/storage";
import { AssetRepository } from "../services/repository/asset";
import { ProfileRepository } from "../services/repository/profile";
import { SocialLinkRepository } from "../services/repository/social-link";
import { HealthSurveyRepository } from "../services/repository/health-survey";
import { AnalyticsRepository } from "../services/repository/analytics";
import { AssetService } from "../services/business/asset";
import { CDNService } from "../services/business/cdn";
import { ProfileService } from "../services/business/profile";
import { SocialLinkService } from "../services/business/social-link";
import { HealthSurveyService } from "../services/business/health-survey";
import { AnalyticsService } from "../services/business/analytics";

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
    const analyticsRepository = new AnalyticsRepository();

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
    const analyticsService = new AnalyticsService(analyticsRepository);

    return {
      services: {
        storage,
        // Repositories
        assetRepository,
        profileRepository,
        socialLinkRepository,
        healthSurveyRepository,
        analyticsRepository,
        // Services
        assetService,
        cdnService,
        profileService,
        socialLinkService,
        healthSurveyService,
        analyticsService,
      },
    };
  },
);
