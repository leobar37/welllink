import { Elysia } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { ProfileService } from "../../services/business/profile";
import { SocialLinkService } from "../../services/business/social-link";
import { MedicalServiceBusinessService } from "../../services/business/medical-service";
import { ProfileRepository } from "../../services/repository/profile";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { AssetRepository } from "../../services/repository/asset";
import { AnalyticsRepository } from "../../services/repository/analytics";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { DEFAULT_THEME_ID } from "../../config/themes";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, () => {
    // Initialize repositories and services with DI
    // We need to manually instantiate them here because the servicesPlugin
    // might rely on auth context or we want to ensure fresh instances for public access
    // However, since we are using the same classes, we can reuse the logic.
    // The key is that we pass a "guest" context to the methods.

    const profileRepository = new ProfileRepository();
    const socialLinkRepository = new SocialLinkRepository();
    const assetRepository = new AssetRepository();
    const analyticsRepository = new AnalyticsRepository();
    const medicalServiceRepository = new MedicalServiceRepository();

    const profileService = new ProfileService(
      profileRepository,
      assetRepository,
      analyticsRepository,
    );

    const socialLinkService = new SocialLinkService(
      socialLinkRepository,
      analyticsRepository,
    );

    const medicalServiceService = new MedicalServiceBusinessService(
      medicalServiceRepository,
      assetRepository,
    );

    return {
      profileService,
      socialLinkService,
      medicalServiceService,
    };
  })
  .get(
    "/profiles/:username",
    async ({ params, profileService, socialLinkService, medicalServiceService }) => {
      // Create a guest context
      const guestCtx = {
        userId: "", // Empty string or specific guest ID
        email: "",
        role: "guest",
      };

      const profile = await profileService.getProfileByUsername(
        guestCtx,
        params.username,
      );
      const socialLinks = await socialLinkService.getSocialLinks(
        guestCtx,
        profile.id,
      );

      // Fetch active medical services
      const allServices = await medicalServiceService.getServicesByProfile(profile.id);
      const medicalServices = allServices.filter((service) => service.isActive);

      // Build features array from profile's featuresConfig
      const featuresConfig = profile.featuresConfig || {};
      const whatsappCtaConfig = featuresConfig.whatsappCta || {
        enabled: false,
        buttonText: "Escríbeme por WhatsApp",
      };

      const features = [
        {
          id: "whatsapp-cta",
          type: "whatsapp-cta",
          isEnabled: whatsappCtaConfig.enabled,
          config: {
            buttonText:
              whatsappCtaConfig.buttonText || "Escríbeme por WhatsApp",
          },
        },
      ];

      // Get themeId from customization (loaded via relation)
      const themeId = profile.customization?.themeId ?? DEFAULT_THEME_ID;

      return {
        profile: {
          ...profile,
          avatarUrl: profile.avatarId
            ? `/api/assets/${profile.avatarId}/public`
            : null,
        },
        socialLinks,
        features,
        themeId,
        medicalServices,
      };
    },
  )
  .get(
    "/profiles/:username/services",
    async ({ params, profileService }) => {
      const guestCtx = {
        userId: "",
        email: "",
        role: "guest",
      };

      const profile = await profileService.getProfileByUsername(
        guestCtx,
        params.username,
      );

      const medicalServiceRepository = new MedicalServiceRepository();
      const allServices = await medicalServiceRepository.findActiveByProfileId(profile.id);

      return {
        services: allServices,
      };
    },
  )
  .get(
    "/profiles/:username/slots/:serviceId",
    async ({ params, query, profileService }) => {
      const guestCtx = {
        userId: "",
        email: "",
        role: "guest",
      };

      const profile = await profileService.getProfileByUsername(
        guestCtx,
        params.username,
      );

      const timeSlotRepository = new TimeSlotRepository();

      const startDate = query.date
        ? new Date(query.date)
        : new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      const slots = await timeSlotRepository.findAvailableSlots(
        profile.id,
        params.serviceId,
        startDate,
      );

      return {
        slots: slots.filter(slot => {
          const slotDate = new Date(slot.startTime);
          return slotDate >= startDate && slotDate <= endDate;
        }),
        serviceId: params.serviceId,
        date: query.date || startDate.toISOString(),
      };
    },
  );
