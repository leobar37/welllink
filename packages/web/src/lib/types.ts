import type { Profile as DbProfile, SocialLink as DbSocialLink } from "@wellness/api";

// Extend the DB profile with properties returned by the API (e.g. computed avatarUrl)
export type Profile = DbProfile & { 
    avatarUrl?: string | null;
};

export type SocialLink = DbSocialLink;

export interface Feature {
    id: string;
    type: string;
    isEnabled: boolean;
    config: Record<string, unknown>;
}

export interface PublicProfileData {
    profile: Profile;
    socialLinks: SocialLink[];
    features: Feature[];
}
