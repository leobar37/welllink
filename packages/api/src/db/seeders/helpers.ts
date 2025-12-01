import { createStorageStrategy } from "../../services/storage";
import { AssetRepository } from "../../services/repository/asset";
import { ProfileRepository } from "../../services/repository/profile";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { HealthSurveyRepository } from "../../services/repository/health-survey";
import { AnalyticsRepository } from "../../services/repository/analytics";
import { AssetService } from "../../services/business/asset";
import { ProfileService } from "../../services/business/profile";
import { SocialLinkService } from "../../services/business/social-link";
import { HealthSurveyService } from "../../services/business/health-survey";
import { AnalyticsService } from "../../services/business/analytics";
import type { RequestContext } from "../../types/context";

/**
 * Initialize all services needed for seeding
 * This ensures we use the same business logic as the application
 */
export async function initializeServices() {
  // Initialize storage
  const storage = createStorageStrategy();
  await storage.initialize();

  // Repositories
  const assetRepository = new AssetRepository();
  const profileRepository = new ProfileRepository();
  const socialLinkRepository = new SocialLinkRepository();
  const healthSurveyRepository = new HealthSurveyRepository();
  const analyticsRepository = new AnalyticsRepository();

  // Services
  const assetService = new AssetService(assetRepository, storage);
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
    storage,
    repositories: {
      assetRepository,
      profileRepository,
      socialLinkRepository,
      healthSurveyRepository,
      analyticsRepository,
    },
    services: {
      assetService,
      profileService,
      socialLinkService,
      healthSurveyService,
      analyticsService,
    },
  };
}

/**
 * Create a mock RequestContext for seeding
 * This allows us to use services that expect a context
 */
export function createSeederContext(userId: string): RequestContext {
  return {
    userId,
    // Add other required context fields as needed
  } as RequestContext;
}
