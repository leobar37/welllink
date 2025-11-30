/**
 * Data Transfer Objects (DTOs) for the Wellness Link API
 * These types replace `any` usage throughout the codebase
 */

// =============================================================================
// Profile DTOs
// =============================================================================

export interface CreateProfileData {
  username: string;
  title?: string;
  bio?: string;
  avatarId?: string;
  coverImageId?: string;
  whatsappNumber?: string;
  isDefault?: boolean;
  isPublished?: boolean;
}

export interface UpdateProfileData {
  username?: string;
  title?: string;
  bio?: string;
  avatarId?: string;
  coverImageId?: string;
  whatsappNumber?: string;
  isDefault?: boolean;
  isPublished?: boolean;
}

// =============================================================================
// Asset DTOs
// =============================================================================

export interface CreateAssetData {
  storagePath: string;
  filename: string;
  mimeType: string;
  type: string;
  size: number;
  metadata?: Record<string, unknown>;
}

export interface CreateAssetWithPathData {
  path: string;
  filename: string;
  mimeType: string;
  type: string;
  size: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetData {
  filename?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Social Link DTOs
// =============================================================================

export type SocialPlatform =
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube";

export interface CreateSocialLinkData {
  profileId: string;
  platform: SocialPlatform;
  url: string;
  displayOrder?: number;
}

export interface UpdateSocialLinkData {
  platform?: SocialPlatform;
  url?: string;
  displayOrder?: number;
}

// =============================================================================
// Onboarding DTOs
// =============================================================================

export interface ProfileCreationData {
  name: string;
  slug: string;
  bio?: string;
}

/** Alias for onboarding step that maps to CreateProfileData */
export interface OnboardingProfileData {
  username: string;
  title?: string;
  bio?: string;
}

export interface AvatarUploadData {
  fileId: string;
}

export interface SocialLinksData {
  links: Array<{
    platform: string;
    url: string;
  }>;
}

export interface ThemeData {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  accentColor?: string;
}

export type OnboardingStepPayload =
  | ProfileCreationData
  | AvatarUploadData
  | SocialLinksData
  | ThemeData;

export interface OnboardingStepUpdateData {
  completed?: boolean;
  skipped?: boolean;
  stepData?: OnboardingStepPayload;
}

export interface OnboardingExample {
  name?: string;
  slug?: string;
  bio?: string;
  platform?: string;
  url?: string;
}

// =============================================================================
// Health Survey DTOs
// =============================================================================

export interface CreateHealthSurveyData {
  profileId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorWhatsapp?: string;
  referredBy?: string;
  responses: Record<string, unknown>;
}

export interface UpdateHealthSurveyData {
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorWhatsapp?: string;
  referredBy?: string;
  responses?: Record<string, unknown>;
}
