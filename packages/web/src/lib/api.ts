export interface Profile {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
    theme: string;
    stats: {
        views: number;
        clicks: number;
    };
}

export interface SocialLink {
    id: string;
    platform: string;
    url: string;
    order: number;
}

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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5300";

export async function getPublicProfile(username: string): Promise<PublicProfileData> {
    const response = await fetch(`${API_BASE_URL}/api/public/profiles/${username}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Profile not found");
        }
        throw new Error("Failed to fetch profile");
    }

    return response.json();
}
