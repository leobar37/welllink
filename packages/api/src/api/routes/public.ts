import { Elysia, t } from "elysia";
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
// AvailabilityRuleRepository: REMOVED - availability now in profile table
import { ReservationRequestRepository } from "../../services/repository/reservation-request";
import { ReservationRequestService } from "../../services/business/reservation-request";
import { AvailabilityValidationService } from "../../services/business/availability-validation";
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
    // availabilityRuleRepository: REMOVED - availability now in profile table
    const reservationRequestRepository = new ReservationRequestRepository();

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

    const availabilityValidationService = new AvailabilityValidationService(
      profileRepository,
    );
    const reservationRequestService = new ReservationRequestService(
      reservationRequestRepository,
      medicalServiceRepository,
      availabilityValidationService,
    );

    return {
      profileService,
      socialLinkService,
      medicalServiceService,
      reservationRequestService,
    };
  })
  .get(
    "/profiles/:username",
    async ({
      params,
      profileService,
      socialLinkService,
      medicalServiceService,
    }) => {
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
      const allServices = await medicalServiceService.getServicesByProfile(
        profile.id,
      );
      const medicalServices = allServices.filter((service) => service.isActive);

      // Build features array from profile's featuresConfig
      const featuresConfig = profile.featuresConfig || {};
      const whatsappCtaConfig = featuresConfig.whatsappCta || {
        enabled: false,
        buttonText: "Escríbeme por WhatsApp",
      };
      const appointmentsConfig = featuresConfig.appointments || {
        enabled: false,
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
        {
          id: "appointments",
          type: "appointments",
          isEnabled: appointmentsConfig.enabled,
          config: {},
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
  .get("/profiles/:username/services", async ({ params, profileService }) => {
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
    const allServices = await medicalServiceRepository.findActiveByProfileId(
      profile.id,
    );

    return {
      services: allServices,
    };
  })
  .post(
    "/:username/booking",
    async ({
      params,
      body,
      profileService,
      reservationRequestService,
      set,
    }) => {
      const guestCtx = {
        userId: "",
        email: "",
        role: "guest",
      };

      try {
        const profile = await profileService.getProfileByUsername(
          guestCtx,
          params.username,
        );

        const result = await reservationRequestService.createRequest({
          profileId: profile.id,
          serviceId: body.serviceId,
          preferredDate: body.preferredDate,
          preferredTime: body.preferredTime,
          timezone: body.timezone,
          patientName: body.patientName,
          patientPhone: body.patientPhone,
          patientEmail: body.patientEmail,
          patientAge: body.patientAge,
          patientGender: body.patientGender,
          chiefComplaint: body.chiefComplaint,
          symptoms: body.symptoms,
          medicalHistory: body.medicalHistory,
          currentMedications: body.currentMedications,
          allergies: body.allergies,
          urgencyLevel: body.urgencyLevel,
        });

        set.status = 201;
        return {
          success: true,
          message:
            "Solicitud de cita creada exitosamente. El profesional confirmará tu cita pronto.",
          requestId: result.request.id,
          expiresAt: result.request.expiresAt,
          service: {
            name: result.service.name,
            duration: result.service.duration,
          },
        };
      } catch (error: any) {
        set.status = error.status || 400;
        return {
          success: false,
          message: error.message || "Error al crear la solicitud de cita",
        };
      }
    },
    {
      body: t.Object({
        serviceId: t.String({ minLength: 1 }),
        preferredDate: t.String({ minLength: 1 }),
        preferredTime: t.String({ minLength: 1 }),
        timezone: t.String({ minLength: 1 }),
        patientName: t.String({ minLength: 2 }),
        patientPhone: t.String({ minLength: 8 }),
        patientEmail: t.Optional(t.String()),
        patientAge: t.Optional(t.Number()),
        patientGender: t.Optional(t.String()),
        chiefComplaint: t.Optional(t.String()),
        symptoms: t.Optional(t.String()),
        medicalHistory: t.Optional(t.String()),
        currentMedications: t.Optional(t.String()),
        allergies: t.Optional(t.String()),
        urgencyLevel: t.Optional(
          t.Union([
            t.Literal("low"),
            t.Literal("normal"),
            t.Literal("high"),
            t.Literal("urgent"),
          ]),
        ),
      }),
    },
  );
