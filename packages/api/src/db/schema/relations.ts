import { relations } from "drizzle-orm";
import { user, account, session } from "./auth";
import { asset } from "./asset";
import { profile } from "./profile";
import { profileCustomization } from "./profile-customization";
import { socialLink } from "./social-link";
// health-survey: REMOVED - legacy wellness feature
import { profileView, socialClick, qrDownload } from "./analytics";
// ai-recommendation: REMOVED - legacy wellness feature
import { service } from "./service";
import { serviceProduct } from "./service-product";
import { product } from "./product";
import { whatsappConfig } from "./whatsapp-config";
import { whatsappMessage } from "./whatsapp-message";
import { whatsappTemplate } from "./whatsapp-template";
import { whatsappContext } from "./whatsapp-context";
import { automation } from "./automation";
import { automationTrigger } from "./automation-trigger";
import { automationAction } from "./automation-action";
import { automationExecutionLog } from "./automation-execution-log";

// STAFF MANAGEMENT
import { staff } from "./staff";
import { staffService } from "./staff-service";
import { staffAvailability } from "./staff-availability";

// User relations
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  assets: many(asset),
  profiles: many(profile),
}));

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// Asset relations
export const assetRelations = relations(asset, ({ one }) => ({
  user: one(user, {
    fields: [asset.userId],
    references: [user.id],
  }),
}));

// Profile relations
export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
  avatar: one(asset, {
    fields: [profile.avatarId],
    references: [asset.id],
    relationName: "profileAvatar",
  }),
  coverImage: one(asset, {
    fields: [profile.coverImageId],
    references: [asset.id],
    relationName: "profileCoverImage",
  }),
  customization: one(profileCustomization),
  socialLinks: many(socialLink),
  // healthSurveyResponses: REMOVED - health_survey_response table deleted
  // aiRecommendations: REMOVED
  views: many(profileView),
  qrDownloads: many(qrDownload),
  services: many(service),
  whatsappConfigs: many(whatsappConfig),
  whatsappContexts: many(whatsappContext),
}));

// Profile Customization relations
export const profileCustomizationRelations = relations(
  profileCustomization,
  ({ one }) => ({
    profile: one(profile, {
      fields: [profileCustomization.profileId],
      references: [profile.id],
    }),
  }),
);

// Social Link relations
export const socialLinkRelations = relations(socialLink, ({ one, many }) => ({
  profile: one(profile, {
    fields: [socialLink.profileId],
    references: [profile.id],
  }),
  clicks: many(socialClick),
}));

// health-survey relations: REMOVED - table deleted
// ai-recommendation relations: REMOVED

// Profile View relations
export const profileViewRelations = relations(profileView, ({ one }) => ({
  profile: one(profile, {
    fields: [profileView.profileId],
    references: [profile.id],
  }),
}));

// Social Click relations
export const socialClickRelations = relations(socialClick, ({ one }) => ({
  socialLink: one(socialLink, {
    fields: [socialClick.socialLinkId],
    references: [socialLink.id],
  }),
}));

// QR Download relations
export const qrDownloadRelations = relations(qrDownload, ({ one }) => ({
  profile: one(profile, {
    fields: [qrDownload.profileId],
    references: [profile.id],
  }),
}));

// Service relations
export const serviceRelations = relations(service, ({ one, many }) => ({
  profile: one(profile, {
    fields: [service.profileId],
    references: [profile.id],
  }),
  imageAsset: one(asset, {
    fields: [service.imageAssetId],
    references: [asset.id],
  }),
  serviceProducts: many(serviceProduct),
}));

// Service-Product junction relations
export const serviceProductRelations = relations(serviceProduct, ({ one }) => ({
  profile: one(profile, {
    fields: [serviceProduct.profileId],
    references: [profile.id],
  }),
  service: one(service, {
    fields: [serviceProduct.serviceId],
    references: [service.id],
  }),
  product: one(product, {
    fields: [serviceProduct.productId],
    references: [product.id],
  }),
}));

// WhatsApp Config relations
export const whatsappConfigRelations = relations(
  whatsappConfig,
  ({ one, many }) => ({
    profile: one(profile, {
      fields: [whatsappConfig.profileId],
      references: [profile.id],
    }),
    messages: many(whatsappMessage),
    templates: many(whatsappTemplate),
  }),
);

// WhatsApp Message relations
export const whatsappMessageRelations = relations(
  whatsappMessage,
  ({ one }) => ({
    config: one(whatsappConfig, {
      fields: [whatsappMessage.configId],
      references: [whatsappConfig.id],
    }),
  }),
);

// WhatsApp Template relations
export const whatsappTemplateRelations = relations(
  whatsappTemplate,
  ({ one }) => ({
    config: one(whatsappConfig, {
      fields: [whatsappTemplate.configId],
      references: [whatsappConfig.id],
    }),
  }),
);

// WhatsApp Context relations
export const whatsappContextRelations = relations(
  whatsappContext,
  ({ one }) => ({
    profile: one(profile, {
      fields: [whatsappContext.profileId],
      references: [profile.id],
    }),
  }),
);

// Automation relations
export const automationRelations = relations(automation, ({ one, many }) => ({
  profile: one(profile, {
    fields: [automation.profileId],
    references: [profile.id],
  }),
  triggers: many(automationTrigger),
  actions: many(automationAction),
  executionLogs: many(automationExecutionLog),
}));

// Automation Trigger relations
export const automationTriggerRelations = relations(
  automationTrigger,
  ({ one }) => ({
    automation: one(automation, {
      fields: [automationTrigger.automationId],
      references: [automation.id],
    }),
  })
);

// Automation Action relations
export const automationActionRelations = relations(automationAction, ({ one }) => ({
  automation: one(automation, {
    fields: [automationAction.automationId],
    references: [automation.id],
  }),
}));

// Automation Execution Log relations
export const automationExecutionLogRelations = relations(
  automationExecutionLog,
  ({ one }) => ({
    automation: one(automation, {
      fields: [automationExecutionLog.automationId],
      references: [automation.id],
    }),
  })
);

// ==========================================
// STAFF MANAGEMENT RELATIONS
// ==========================================

// Staff relations
export const staffRelations = relations(staff, ({ one, many }) => ({
  profile: one(profile, {
    fields: [staff.profileId],
    references: [profile.id],
  }),
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
  avatar: one(asset, {
    fields: [staff.avatarId],
    references: [asset.id],
    relationName: "staffAvatar",
  }),
  services: many(staffService),
  availabilities: many(staffAvailability),
}));

// Staff-Service junction relations
export const staffServiceRelations = relations(staffService, ({ one }) => ({
  staff: one(staff, {
    fields: [staffService.staffId],
    references: [staff.id],
  }),
  service: one(service, {
    fields: [staffService.serviceId],
    references: [service.id],
  }),
}));

// Staff Availability relations
export const staffAvailabilityRelations = relations(staffAvailability, ({ one }) => ({
  staff: one(staff, {
    fields: [staffAvailability.staffId],
    references: [staff.id],
  }),
}));
