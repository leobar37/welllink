import type {
  Profile as DbProfile,
  SocialLink as DbSocialLink,
} from "../../../api/src/db/schema";

// Extend the DB profile with properties returned by the API (e.g. computed avatarUrl)
export type Profile = DbProfile & {
  avatarUrl?: string | null;
};

export type SocialLink = DbSocialLink;

interface BaseFeature<Config = Record<string, unknown>> {
  id: string;
  type: string;
  isEnabled: boolean;
  config: Config;
}

export interface HealthSurveyFeature extends BaseFeature<{
  buttonText?: string;
}> {
  type: "health-survey";
}

export interface WhatsAppCtaFeature extends BaseFeature<{
  buttonText?: string;
}> {
  type: "whatsapp-cta";
}

export type Feature =
  | HealthSurveyFeature
  | WhatsAppCtaFeature
  | BaseFeature;

export interface PublicProfileData {
  profile: Profile;
  socialLinks: SocialLink[];
  features: Feature[];
  themeId?: string;
}
