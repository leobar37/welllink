import { relations } from "drizzle-orm";
import { user, account, session } from "./auth";
import { asset } from "./asset";
import { profile } from "./profile";
import { profileCustomization } from "./profile-customization";
import { socialLink } from "./social-link";
import { healthSurveyResponse } from "./health-survey";
import { profileView, socialClick, qrDownload } from "./analytics";
import { storySection } from "./story-section";
import { story } from "./story";
import { storyEvent } from "./story-event";
import { aiRecommendation } from "./ai-recommendation";

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
  storySection: one(storySection, {
    fields: [profile.id],
    references: [storySection.profileId],
  }),
  stories: many(story),
  storyEvents: many(storyEvent),
}));

// Profile Customization relations
export const profileCustomizationRelations = relations(
  profileCustomization,
  ({ one }) => ({
    profile: one(profile, {
      fields: [profileCustomization.profileId],
      references: [profile.id],
    }),
  })
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
  })
);

// AI Recommendation relations
export const aiRecommendationRelations = relations(
  aiRecommendation,
  ({ one }) => ({
    profile: one(profile, {
      fields: [aiRecommendation.profileId],
      references: [profile.id],
    }),
    surveyResponse: one(healthSurveyResponse, {
      fields: [aiRecommendation.surveyResponseId],
      references: [healthSurveyResponse.id],
    }),
  })
);

// Story Section relations
export const storySectionRelations = relations(storySection, ({ one }) => ({
  profile: one(profile, {
    fields: [storySection.profileId],
    references: [profile.id],
  }),
}));

// Story relations
export const storyRelations = relations(story, ({ one }) => ({
  profile: one(profile, {
    fields: [story.profileId],
    references: [profile.id],
  }),
  beforeAsset: one(asset, {
    fields: [story.beforeAssetId],
    references: [asset.id],
    relationName: "storyBeforeAsset",
  }),
  afterAsset: one(asset, {
    fields: [story.afterAssetId],
    references: [asset.id],
    relationName: "storyAfterAsset",
  }),
}));

// Story Event relations
export const storyEventRelations = relations(storyEvent, ({ one }) => ({
  profile: one(profile, {
    fields: [storyEvent.profileId],
    references: [profile.id],
  }),
  story: one(story, {
    fields: [storyEvent.storyId],
    references: [story.id],
  }),
}));

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
