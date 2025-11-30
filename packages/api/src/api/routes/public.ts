import { Elysia } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { ProfileService } from "../../services/business/profile";
import { SocialLinkService } from "../../services/business/social-link";
import { ProfileRepository } from "../../services/repository/profile";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { AssetRepository } from "../../services/repository/asset";
import { AnalyticsRepository } from "../../services/repository/analytics";

export const publicRoutes = new Elysia({ prefix: "/public" })
    .use(errorMiddleware)
    .use(servicesPlugin)
    .derive({ as: "global" }, () => {
        // Initialize repositories and services with DI
        // We need to manually instantiate them here because the servicesPlugin 
        // might rely on auth context or we want to ensure fresh instances for public access
        // However, since we are using the same classes, we can reuse the logic.
        // The key is that we pass a "guest" context to the methods.

        const profileRepository = new ProfileRepository();
        const socialLinkRepository = new SocialLinkRepository();
        const assetRepository = new AssetRepository();
        const analyticsRepository = new AnalyticsRepository();

        const profileService = new ProfileService(
            profileRepository,
            assetRepository,
            analyticsRepository,
        );

        const socialLinkService = new SocialLinkService(
            socialLinkRepository,
            analyticsRepository,
        );

        return {
            profileService,
            socialLinkService,
        };
    })
    .get("/profiles/:username", async ({ params, profileService, socialLinkService }) => {
        // Create a guest context
        const guestCtx = {
            userId: "", // Empty string or specific guest ID
            email: "",
            role: "guest",
        };

        const profile = await profileService.getProfileByUsername(guestCtx, params.username);
        const socialLinks = await socialLinkService.getSocialLinks(guestCtx, profile.id);

        // Mock features for now until Feature module is ready
        const features = [
            {
                id: "1",
                type: "health-survey",
                isEnabled: true,
                config: {
                    buttonText: "Evalúate gratis",
                },
            },
        ];

        return {
            profile: {
                ...profile,
                // Ensure we return the avatar URL if it exists (ProfileService might return avatarId)
                // actually ProfileService returns the raw profile record. 
                // We might need to resolve the avatar URL if it's not in the record.
                // But for now let's assume the frontend handles it or the record has it.
                // Looking at the schema, it has avatarId. 
                // The frontend expects avatarUrl.
                // We should probably resolve it here or let the frontend construct it.
                // For MVP, let's assume the frontend constructs it or we add it here.
                avatarUrl: profile.avatarId ? `/api/assets/${profile.avatarId}/public` : null,
            },
            socialLinks,
            features,
        };
    });
