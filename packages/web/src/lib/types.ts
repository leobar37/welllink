import type {
  Profile as DbProfile,
  SocialLink as DbSocialLink,
  MedicalService as DbMedicalService,
} from "../../../api/src/db/schema";

// Extend the DB profile with properties returned by the API (e.g. computed avatarUrl)
export type Profile = DbProfile & {
  avatarUrl?: string | null;
};

// Extend the DB social link with URL computed by backend
export type SocialLink = DbSocialLink & {
  url: string;
};

export type MedicalService = DbMedicalService & {
  imageAssetId?: string | null;
};

interface BaseFeature<Config = Record<string, unknown>> {
  id: string;
  type: string;
  isEnabled: boolean;
  config: Config;
}

export interface WhatsAppCtaFeature extends BaseFeature<{
  buttonText?: string;
}> {
  type: "whatsapp-cta";
}

export interface AppointmentsFeature extends BaseFeature<
  Record<string, never>
> {
  type: "appointments";
}

export type Feature = WhatsAppCtaFeature | AppointmentsFeature | BaseFeature;

export interface PublicProfileData {
  profile: Profile;
  socialLinks: SocialLink[];
  features: Feature[];
  themeId?: string;
  medicalServices?: MedicalService[];
}
