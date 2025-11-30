import { NotFoundException } from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type {
  ProfileCreationData,
  AvatarUploadData,
  SocialLinksData,
  ThemeData,
  OnboardingStepPayload,
  OnboardingExample,
} from "../../types/dto";
import { ProfileService } from "./profile";
import { AssetService } from "./asset";

export interface OnboardingStep {
  id: string;
  name: string;
  title: string;
  description: string;
  type: "profile" | "avatar" | "social" | "theme" | "completion";
  completed: boolean;
  skipped: boolean;
  data?: OnboardingStepPayload;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  steps: OnboardingStep[];
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining: number; // in minutes
}

export class OnboardingService {
  constructor(
    private profileService: ProfileService,
    private assetService: AssetService,
  ) {}

  async getOnboardingProgress(
    ctx: RequestContext,
  ): Promise<OnboardingProgress> {
    const profiles = await this.profileService.getProfiles(ctx);
    const hasProfiles = profiles.length > 0;

    // Build onboarding steps based on user state
    const steps: OnboardingStep[] = [
      {
        id: "welcome",
        name: "welcome",
        title: "Welcome to Wellness Link",
        description: "Let's set up your profile to connect with others.",
        type: "profile",
        completed: false,
        skipped: false,
      },
      {
        id: "create_profile",
        name: "create_profile",
        title: "Create Your Profile",
        description: "Add your basic information and choose a unique URL.",
        type: "profile",
        completed: hasProfiles,
        skipped: false,
      },
      {
        id: "upload_avatar",
        name: "upload_avatar",
        title: "Add Your Avatar",
        description: "Upload a profile picture to help others recognize you.",
        type: "avatar",
        completed: false,
        skipped: false,
      },
      {
        id: "add_social_links",
        name: "add_social_links",
        title: "Connect Your Social Media",
        description: "Add your social media links to stay connected.",
        type: "social",
        completed: false,
        skipped: false,
      },
      {
        id: "customize_theme",
        name: "customize_theme",
        title: "Personalize Your Look",
        description: "Choose colors and themes that represent you.",
        type: "theme",
        completed: false,
        skipped: false,
      },
      {
        id: "completion",
        name: "completion",
        title: "You're All Set!",
        description: "Your profile is ready. Start connecting with others.",
        type: "completion",
        completed: false,
        skipped: false,
      },
    ];

    // Check avatar completion if user has profiles
    if (hasProfiles && profiles[0]) {
      const mainProfile = profiles[0];
      const avatarStep = steps[2];
      if (avatarStep) {
        avatarStep.completed = !!mainProfile.avatarId;
      }
    }

    const completedSteps = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const currentStepIndex = steps.findIndex(
      (step) => !step.completed && !step.skipped,
    );
    const currentStep = Math.max(0, currentStepIndex);

    // Calculate estimated time remaining (2 minutes per incomplete step)
    const incompleteSteps = totalSteps - completedSteps;
    const estimatedTimeRemaining = incompleteSteps * 2;

    return {
      userId: ctx.userId,
      currentStep,
      totalSteps,
      completedSteps,
      percentage: Math.round((completedSteps / totalSteps) * 100),
      steps,
      startedAt: new Date(),
      estimatedTimeRemaining,
    };
  }

  async updateOnboardingStep(
    ctx: RequestContext,
    stepId: string,
    data: {
      completed?: boolean;
      skipped?: boolean;
      stepData?: OnboardingStepPayload;
    },
  ): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(ctx);
    const step = progress.steps.find((s) => s.id === stepId);

    if (!step) {
      throw new NotFoundException("Onboarding step not found");
    }

    // Update step
    if (data.completed !== undefined) {
      step.completed = data.completed;
    }
    if (data.skipped !== undefined) {
      step.skipped = data.skipped;
    }
    if (data.stepData) {
      step.data = data.stepData;
    }

    // Handle specific step logic
    if (stepId === "create_profile" && data.completed && data.stepData) {
      await this.handleProfileCreation(
        ctx,
        data.stepData as ProfileCreationData,
      );
    } else if (stepId === "upload_avatar" && data.completed && data.stepData) {
      await this.handleAvatarUpload(ctx, data.stepData as AvatarUploadData);
    } else if (stepId === "add_social_links" && data.stepData) {
      await this.handleSocialLinks(ctx, data.stepData as SocialLinksData);
    } else if (stepId === "customize_theme" && data.stepData) {
      await this.handleThemeCustomization(ctx, data.stepData as ThemeData);
    }

    return this.getOnboardingProgress(ctx);
  }

  async skipOnboarding(ctx: RequestContext): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(ctx);

    // Mark all incomplete steps as skipped
    progress.steps.forEach((step) => {
      if (!step.completed) {
        step.skipped = true;
      }
    });

    return progress;
  }

  async resetOnboarding(ctx: RequestContext): Promise<OnboardingProgress> {
    // In a real implementation, you'd delete onboarding progress
    // For now, just return fresh progress
    return this.getOnboardingProgress(ctx);
  }

  async getOnboardingTips(
    _ctx: RequestContext,
    stepId: string,
  ): Promise<{
    step: string;
    tips: string[];
    examples?: OnboardingExample[];
  }> {
    const tipsMap: Record<string, string[]> = {
      create_profile: [
        "Choose a memorable slug that represents you",
        "Keep your bio short and engaging",
        "Use your real name for better discoverability",
        "Add keywords that describe your interests",
      ],
      upload_avatar: [
        "Use a high-quality photo with good lighting",
        "Make sure your face is clearly visible",
        "Square images work best (1:1 ratio)",
        "File size should be under 5MB for faster loading",
      ],
      add_social_links: [
        "Only add social media you actively use",
        "Choose platforms where your audience can reach you",
        "Keep usernames consistent across platforms",
        "Update links if you change your usernames",
      ],
      customize_theme: [
        "Choose colors that reflect your personality",
        "Ensure text is readable against background colors",
        "Consider your audience and professional context",
        "Dark themes reduce eye strain for many users",
      ],
    };

    const examplesMap: Record<string, OnboardingExample[]> = {
      create_profile: [
        {
          name: "John Doe",
          slug: "johndoe",
          bio: "Digital creator sharing my journey",
        },
        {
          name: "Sarah Smith",
          slug: "sarahsmith",
          bio: "Photographer & nature lover 🌿",
        },
        {
          name: "Tech Mike",
          slug: "techmike",
          bio: "Building the future, one line at a time",
        },
      ],
      social_links: [
        { platform: "twitter", url: "https://twitter.com/johndoe" },
        { platform: "instagram", url: "https://instagram.com/sarahsmith" },
        { platform: "github", url: "https://github.com/techmike" },
      ],
    };

    return {
      step: stepId,
      tips: tipsMap[stepId] || [],
      examples: examplesMap[stepId],
    };
  }

  private async handleProfileCreation(
    ctx: RequestContext,
    profileData: ProfileCreationData,
  ): Promise<void> {
    await this.profileService.createProfile(ctx, {
      username: profileData.slug,
      title: profileData.name,
      bio: profileData.bio,
    });
  }

  private async handleAvatarUpload(
    ctx: RequestContext,
    avatarData: AvatarUploadData,
  ): Promise<void> {
    if (avatarData.fileId) {
      // User already uploaded file, update profile
      const profiles = await this.profileService.getProfiles(ctx);
      const firstProfile = profiles[0];
      if (firstProfile) {
        await this.profileService.updateProfile(ctx, firstProfile.id, {
          avatarId: avatarData.fileId,
        });
      }
    }
  }

  private async handleSocialLinks(
    ctx: RequestContext,
    socialData: SocialLinksData,
  ): Promise<void> {
    const profiles = await this.profileService.getProfiles(ctx);
    if (profiles.length === 0) return;

    // Add social links (would use SocialLinkService in real implementation)
    for (const link of socialData.links) {
      console.log(`Would add social link: ${link.platform} - ${link.url}`);
    }
  }

  private async handleThemeCustomization(
    ctx: RequestContext,
    themeData: ThemeData,
  ): Promise<void> {
    const profiles = await this.profileService.getProfiles(ctx);
    if (profiles.length === 0) return;

    // Update theme (would use ProfileCustomizationService)
    console.log(`Would update theme for user ${ctx.userId}:`, themeData);
  }
}
