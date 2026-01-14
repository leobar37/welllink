import { relations } from "drizzle-orm";
import { user, account, session } from "./auth";
import { asset } from "./asset";
import { profile } from "./profile";
import { profileCustomization } from "./profile-customization";
import { socialLink } from "./social-link";
import { healthSurveyResponse } from "./health-survey";
import { profileView, socialClick, qrDownload } from "./analytics";
import { aiRecommendation } from "./ai-recommendation";
import { medicalService } from "./medical-service";

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
  healthSurveyResponses: many(healthSurveyResponse),
  aiRecommendations: many(aiRecommendation),
  views: many(profileView),
  qrDownloads: many(qrDownload),
  medicalServices: many(medicalService),
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

// Health Survey Response relations
export const healthSurveyResponseRelations = relations(
  healthSurveyResponse,
  ({ one, many }) => ({
    profile: one(profile, {
      fields: [healthSurveyResponse.profileId],
      references: [profile.id],
    }),
    aiRecommendations: many(aiRecommendation),
  }),
);

// AI Recommendation relations
export const aiRecommendationRelations = relations(
  aiRecommendation,
  ({ one }) => ({
    profile: one(profile, {
      fields: [aiRecommendation.profileId],
      references: [profile.id],
    }),
    // COMMENTED OUT: This relation causes SQL errors with Drizzle query builder
    // Use manual joins if you need surveyResponse data
    // surveyResponse: one(healthSurveyResponse, {
    //   fields: [aiRecommendation.surveyResponseId],
    //   references: [healthSurveyResponse.id],
    // }),
  }),
);

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

// Medical Service relations
export const medicalServiceRelations = relations(medicalService, ({ one }) => ({
  profile: one(profile, {
    fields: [medicalService.profileId],
    references: [profile.id],
  }),
  // imageAsset: one(asset, {
  //   fields: [medicalService.imageAssetId],
  //   references: [asset.id],
  // }),
}));
