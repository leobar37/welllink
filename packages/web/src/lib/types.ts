import type {
  Profile as DbProfile,
  SocialLink as DbSocialLink,
  MedicalService as DbMedicalService,
} from "../../../api/src/db/schema";

// Re-export PaymentMethodType from schema for convenience
export type { PaymentMethodType } from "../../../api/src/db/schema";

export type MedicalService = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: string;
  category?: string;
  isActive: boolean;
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
  profile: DbProfile;
  socialLinks: DbSocialLink[];
  features: Feature[];
  themeId?: string;
  medicalServices?: DbMedicalService[];
}
