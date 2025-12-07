import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useThemeContainer } from "@/components/public-profile/theme-provider";
import { WizardProvider, useWizard, useSurveyDraft } from "./WizardContext";
import { SurveyProgress } from "./SurveyProgress";
import { SurveyNavigation } from "./SurveyNavigation";
import { StepIntro } from "../steps/StepIntro";
import { StepPersonalData } from "../steps/StepPersonalData";
import { StepMeasurements } from "../steps/StepMeasurements";
import { StepConditions } from "../steps/StepConditions";
import { StepHabits } from "../steps/StepHabits";
import { StepSummary } from "../steps/StepSummary";
import { CATEGORY_ORDER } from "@/lib/survey/constants";
import { Loader2 } from "lucide-react";

interface SurveyWizardProps {
  username: string;
  profileId: string;
  advisorName: string;
  advisorAvatar?: string | null;
  advisorWhatsapp: string;
}

export function SurveyWizard(props: SurveyWizardProps) {
  return (
    <WizardProvider username={props.username}>
      <SurveyWizardContent {...props} />
    </WizardProvider>
  );
}

function SurveyWizardContent({
  username,
  profileId,
  advisorName,
  advisorAvatar,
  advisorWhatsapp,
}: SurveyWizardProps) {
  const { state, restoreDraft, nextStep } = useWizard();
  const { hasDraft, draft } = useSurveyDraft(username);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const themeContainer = useThemeContainer();

  // Check for draft on mount
  useEffect(() => {
    if (hasDraft && draft && !initialized) {
      setShowDraftDialog(true);
    } else {
      setInitialized(true);
    }
  }, [hasDraft, draft, initialized]);

  // Handle resume draft
  const handleResumeDraft = () => {
    if (draft) {
      restoreDraft(draft);
    }
    setShowDraftDialog(false);
    setInitialized(true);
  };

  // Handle start fresh
  const handleStartFresh = () => {
    setShowDraftDialog(false);
    setInitialized(true);
  };

  // Show loading while checking draft
  if (!initialized && !showDraftDialog) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    const { currentStep } = state;

    // Step 0: Intro
    if (currentStep === 0) {
      return (
        <>
          <StepIntro
            advisorName={advisorName}
            advisorAvatar={advisorAvatar}
            username={username}
          />
          <SurveyNavigation onSubmit={nextStep} />
        </>
      );
    }

    // Step 1: Personal Data
    if (currentStep === 1) {
      return <StepPersonalData />;
    }

    // Step 2: Measurements
    if (currentStep === 2) {
      return <StepMeasurements />;
    }

    // Steps 3-10: Health Conditions (8 categories)
    if (currentStep >= 3 && currentStep <= 10) {
      const categoryIndex = currentStep - 3;
      const category = CATEGORY_ORDER[categoryIndex];
      return <StepConditions category={category} />;
    }

    // Step 11: Habits
    if (currentStep === 11) {
      return <StepHabits />;
    }

    // Step 12: Summary
    if (currentStep === 12) {
      return (
        <StepSummary
          profileId={profileId}
          advisorWhatsapp={advisorWhatsapp}
          username={username}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent container={themeContainer}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Continuar encuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes una encuesta sin terminar. ¿Quieres continuar donde la
              dejaste?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Empezar de nuevo
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeDraft}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Header - hide on intro step */}
      {state.currentStep > 0 && !state.isSubmitted && <SurveyProgress />}

      {/* Step Content with animation */}
      <main className="flex-1">
        <div
          key={state.currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
