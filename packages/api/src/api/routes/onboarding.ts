import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { OnboardingService } from "../../services/business/onboarding";

export const onboardingRoutes = new Elysia({ prefix: "/onboarding" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .derive({ as: "scoped" }, ({ services }) => {
    // Initialize onboarding service using services from plugin
    const onboardingService = new OnboardingService(
      services.profileService,
    );
    return { onboardingService };
  })
  .get("/progress", async ({ ctx, onboardingService }) => {
    return onboardingService.getOnboardingProgress(ctx!);
  })
  .put(
    "/step/:stepId",
    async ({ params, body, ctx, onboardingService }) => {
      return onboardingService.updateOnboardingStep(ctx!, params.stepId, body);
    },
    {
      body: t.Object({
        completed: t.Optional(t.Boolean()),
        skipped: t.Optional(t.Boolean()),
        stepData: t.Optional(t.Record(t.String(), t.Any())),
      }),
    },
  )
  .get("/tips/:stepId", async ({ params, ctx, onboardingService }) => {
    return onboardingService.getOnboardingTips(ctx!, params.stepId);
  })
  .post("/skip", async ({ ctx, onboardingService }) => {
    return onboardingService.skipOnboarding(ctx!);
  })
  .post("/reset", async ({ ctx, onboardingService }) => {
    return onboardingService.resetOnboarding(ctx!);
  })
  .get("/completion-status", async ({ ctx, onboardingService }) => {
    const progress = await onboardingService.getOnboardingProgress(ctx!);

    return {
      isCompleted: progress.percentage === 100,
      canSkip: progress.currentStep > 0,
      estimatedCompletionTime: progress.estimatedTimeRemaining,
      nextStep: progress.steps.find(
        (s: { completed: boolean; skipped: boolean }) =>
          !s.completed && !s.skipped,
      ),
      completedSteps: progress.steps.filter(
        (s: { completed: boolean }) => s.completed,
      ),
      remainingSteps: progress.steps.filter(
        (s: { completed: boolean; skipped: boolean }) =>
          !s.completed && !s.skipped,
      ),
    };
  })
  .get("/checklist", async ({ ctx, onboardingService }) => {
    const progress = await onboardingService.getOnboardingProgress(ctx!);

    const checklist = {
      profile: {
        title: "Create Profile",
        completed: progress.steps.some(
          (s: { id: string; completed: boolean }) =>
            s.id === "create_profile" && s.completed,
        ),
        description: "Add your name, bio, and unique URL",
      },
      avatar: {
        title: "Upload Avatar",
        completed: progress.steps.some(
          (s: { id: string; completed: boolean }) =>
            s.id === "upload_avatar" && s.completed,
        ),
        description: "Add a profile picture",
      },
      social: {
        title: "Add Social Links",
        completed: progress.steps.some(
          (s: { id: string; completed: boolean }) =>
            s.id === "add_social_links" && s.completed,
        ),
        description: "Connect your social media accounts",
      },
      theme: {
        title: "Customize Theme",
        completed: progress.steps.some(
          (s: { id: string; completed: boolean }) =>
            s.id === "customize_theme" && s.completed,
        ),
        description: "Personalize colors and layout",
      },
    };

    return {
      checklist,
      totalCompleted: Object.values(checklist).filter((item) => item.completed)
        .length,
      totalItems: Object.keys(checklist).length,
      isFullyCompleted: Object.values(checklist).every(
        (item) => item.completed,
      ),
    };
  });
