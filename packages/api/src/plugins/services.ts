import { Elysia } from "elysia";
import {
  createStorageStrategy,
  type StorageStrategy,
} from "../services/storage";
import { env } from "../config/env";
import { AssetRepository } from "../services/repository/asset";
import { ProfileRepository } from "../services/repository/profile";
import { SocialLinkRepository } from "../services/repository/social-link";
import { HealthSurveyRepository } from "../services/repository/health-survey";
import { AIRecommendationRepository } from "../services/repository/ai-recommendation";
import { AnalyticsRepository } from "../services/repository/analytics";
import { WhatsAppConfigRepository } from "../services/repository/whatsapp-config";
import { WhatsAppMessageRepository } from "../services/repository/whatsapp-message";
import { WhatsAppTemplateRepository } from "../services/repository/whatsapp-template";
import { AssetService } from "../services/business/asset";
import { CDNService } from "../services/business/cdn";
import { ProfileService } from "../services/business/profile";
import { SocialLinkService } from "../services/business/social-link";
import { HealthSurveyService } from "../services/business/health-survey";
import { AIRecommendationService } from "../services/business/ai-recommendation";
import { AnalyticsService } from "../services/business/analytics";
import { EvolutionService } from "../services/business/evolution-api";
import { WhatsAppConfigService } from "../services/business/whatsapp-config";
import { WhatsAppService } from "../services/business/whatsapp";
import { WhatsAppTemplateService } from "../services/business/whatsapp-template";

// NEW IMPORTS
import { ClientRepository } from "../services/repository/client";
import { ClientNoteRepository } from "../services/repository/client-note";
import { CampaignTemplateRepository } from "../services/repository/campaign-template";
import { CampaignRepository } from "../services/repository/campaign";
import { CampaignAudienceRepository } from "../services/repository/campaign-audience";

import { MedicalServiceRepository } from "../services/repository/medical-service";
import { TimeSlotRepository } from "../services/repository/time-slot";
import { ReservationRequestRepository } from "../services/repository/reservation-request";
import { ReservationRepository } from "../services/repository/reservation";
import { AvailabilityRuleRepository } from "../services/repository/availability-rule";

import { ClientService } from "../services/business/client";
import { CampaignTemplateService } from "../services/business/campaign-template";
import { CampaignService } from "../services/business/campaign";
import { TemplateVariablesService } from "../services/business/template-variables";

import { getCampaignQueue } from "../services/queue/campaign-queue";

// NEW RESERVATION SERVICES IMPORTS
import { ApprovalService } from "../services/business/approval";
import { NotificationService } from "../services/business/notification";

let storageInstance: StorageStrategy | null = null;
let initialized = false;
let storageInitializationFailed = false;

async function getStorageInstance(): Promise<StorageStrategy | null> {
  if (storageInitializationFailed) {
    return null;
  }

  if (!storageInstance) {
    try {
      storageInstance = await createStorageStrategy();
      if (!initialized) {
        await storageInstance.initialize();
        initialized = true;
      }
    } catch (error) {
      console.warn(
        "Storage initialization failed (R2 credentials not configured):",
        error instanceof Error ? error.message : error,
      );
      storageInitializationFailed = true;
      return null;
    }
  }
  return storageInstance;
}

function createMockStorage(): StorageStrategy {
  return {
    async upload() {
      throw new Error("Storage not available");
    },
    async download() {
      throw new Error("Storage not available");
    },
    async delete() {},
    async initialize() {},
    async exists() {
      return false;
    },
    getPublicUrl(path: string) {
      return path;
    },
    async getSignedUrl() {
      throw new Error("Storage not available");
    },
  };
}

export const servicesPlugin = new Elysia({ name: "services" }).derive(
  { as: "global" },
  async () => {
    const storage = (await getStorageInstance()) || createMockStorage();

    // Repositories
    const assetRepository = new AssetRepository();
    const profileRepository = new ProfileRepository();
    const socialLinkRepository = new SocialLinkRepository();
    const healthSurveyRepository = new HealthSurveyRepository();
    const aiRecommendationRepository = new AIRecommendationRepository();
    const analyticsRepository = new AnalyticsRepository();
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const whatsappMessageRepository = new WhatsAppMessageRepository();
    const whatsappTemplateRepository = new WhatsAppTemplateRepository();

    // NEW REPOSITORIES
    const clientRepository = new ClientRepository();
    const clientNoteRepository = new ClientNoteRepository();
    const campaignTemplateRepository = new CampaignTemplateRepository();
    const campaignRepository = new CampaignRepository();
    const campaignAudienceRepository = new CampaignAudienceRepository();

    const medicalServiceRepository = new MedicalServiceRepository();
    const timeSlotRepository = new TimeSlotRepository();
    const reservationRequestRepository = new ReservationRequestRepository();
    const reservationRepository = new ReservationRepository();
    const availabilityRuleRepository = new AvailabilityRuleRepository();

    // Evolution API service
    const evolutionService = new EvolutionService({
      baseUrl: env.EVOLUTION_API_URL,
      apiKey: env.EVOLUTION_API_KEY,
    });

    // NEW RESERVATION SERVICES
    const templateVariablesService = new TemplateVariablesService(
      profileRepository,
      clientRepository,
    );

    // NEW RESERVATION SERVICES
    const approvalService = new ApprovalService(
      reservationRequestRepository,
      timeSlotRepository,
      reservationRepository,
    );

    const notificationService = new NotificationService(
      whatsappConfigRepository,
      profileRepository,
      medicalServiceRepository,
      evolutionService,
    );

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
      healthSurveyRepository,
    );
    const analyticsService = new AnalyticsService(analyticsRepository);
    const whatsappConfigService = new WhatsAppConfigService(
      whatsappConfigRepository,
      evolutionService,
    );
    const whatsappService = new WhatsAppService(
      whatsappMessageRepository,
      whatsappConfigRepository,
      evolutionService,
    );
    const whatsappTemplateService = new WhatsAppTemplateService(
      whatsappTemplateRepository,
      whatsappConfigRepository,
      evolutionService,
    );

    // NEW SERVICES
    const clientService = new ClientService(
      clientRepository,
      clientNoteRepository,
    );

    const campaignTemplateService = new CampaignTemplateService(
      campaignTemplateRepository,
    );

    const campaignService = new CampaignService(
      campaignRepository,
      campaignAudienceRepository,
      clientRepository,
      templateVariablesService,
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
        whatsappConfigRepository,
        whatsappMessageRepository,
        whatsappTemplateRepository,
        // NEW REPOSITORIES
        clientRepository,
        clientNoteRepository,
        campaignTemplateRepository,
        campaignRepository,
        campaignAudienceRepository,
        medicalServiceRepository,
        timeSlotRepository,
        reservationRequestRepository,
        reservationRepository,
        availabilityRuleRepository,
        // Services
        assetService,
        cdnService,
        profileService,
        socialLinkService,
        healthSurveyService,
        aiRecommendationService,
        analyticsService,
        whatsappConfigService,
        whatsappService,
        whatsappTemplateService,
        // NEW SERVICES
        clientService,
        campaignTemplateService,
        campaignService,
        templateVariablesService,
        evolutionService,
        // NEW RESERVATION SERVICES
        approvalService,
        notificationService,
      },
    };
  },
);
