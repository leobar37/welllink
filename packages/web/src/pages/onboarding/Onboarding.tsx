import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { StepWelcome } from "@/components/onboarding/step-welcome";
import { StepCreateProfile } from "@/components/onboarding/step-create-profile";
import { StepAvatar } from "@/components/onboarding/step-avatar";
import { StepSocial } from "@/components/onboarding/step-social";
import { StepTheme } from "@/components/onboarding/step-theme";
import { StepCompletion } from "@/components/onboarding/step-completion";

// Types from backend
interface OnboardingStep {
  id: string;
  name: string;
  title: string;
  description: string;
  type: string;
  completed: boolean;
  skipped: boolean;
}

export function Onboarding() {
  const navigate = useNavigate();
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [updatingStep, setUpdatingStep] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  type StepPayload = Record<string, unknown>;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthPending && !session) {
      navigate("/auth/login", { replace: true });
      return;
    }

    // Fetch progress only if authenticated
    if (session && !isAuthPending) {
      fetchProgress();
    }
  }, [session, isAuthPending, navigate]);

  async function fetchProgress() {
    try {
      const { data, error } = await api.api.onboarding.progress.get();
      if (error) throw error;
      if (data) {
        setSteps(data.steps as OnboardingStep[]);
        setCurrentStepIndex(data.currentStep);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load onboarding progress");
    } finally {
      setLoading(false);
    }
  }

  async function updateStep(stepId: string, data: StepPayload) {
    setUpdatingStep(true);
    try {
      const { data: resData, error } = await api.api.onboarding.step[
        stepId
      ].put({
        completed: true,
        stepData: data,
      });

      if (error) throw error;

      if (resData) {
        setSteps(resData.steps as OnboardingStep[]);
        setCurrentStepIndex(resData.currentStep);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update step");
    } finally {
      setUpdatingStep(false);
    }
  }

  async function handleNext(data: unknown = {}) {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;
    await updateStep(currentStep.id, data as StepPayload);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progress = (currentStepIndex / (steps.length - 1)) * 100;

  if (!currentStep) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentStep.id === "welcome" && (
          <StepWelcome onNext={handleNext} isLoading={updatingStep} />
        )}
        {currentStep.id === "create_profile" && (
          <StepCreateProfile onNext={handleNext} isLoading={updatingStep} />
        )}
        {currentStep.id === "upload_avatar" && (
          <StepAvatar onNext={handleNext} isLoading={updatingStep} />
        )}
        {currentStep.id === "add_social_links" && (
          <StepSocial onNext={handleNext} isLoading={updatingStep} />
        )}
        {currentStep.id === "customize_theme" && (
          <StepTheme onNext={handleNext} isLoading={updatingStep} />
        )}
        {currentStep.id === "completion" && (
          <StepCompletion onNext={() => handleNext({})} isLoading={updatingStep} />
        )}
      </div>
    </div>
  );
}
