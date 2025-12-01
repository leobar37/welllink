import type {
  Profile as DbProfile,
  SocialLink as DbSocialLink,
  Story as DbStory,
  StorySection,
} from "@wellness/api";

// Extend the DB profile with properties returned by the API (e.g. computed avatarUrl)
export type Profile = DbProfile & { 
    avatarUrl?: string | null;
};

export type SocialLink = DbSocialLink;

export type TuHistoriaStory = DbStory;
export type TuHistoriaSection = StorySection;

interface BaseFeature<Config = Record<string, unknown>> {
  id: string;
  type: string;
  isEnabled: boolean;
  config: Config;
}

export interface HealthSurveyFeature
  extends BaseFeature<{ buttonText?: string }> {
  type: "health-survey";
}

export interface TuHistoriaFeature
  extends BaseFeature<{
    buttonText?: string;
    section: TuHistoriaSection | null;
    stories: TuHistoriaStory[];
  }> {
  type: "tu-historia";
}

export type Feature =
  | HealthSurveyFeature
  | TuHistoriaFeature
  | BaseFeature;

export interface PublicProfileData {
    profile: Profile;
    socialLinks: SocialLink[];
    features: Feature[];
}
