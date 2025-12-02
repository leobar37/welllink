import { ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "./WizardContext";
import { TOTAL_STEPS, CATEGORY_ORDER } from "@/lib/survey/constants";

interface SurveyNavigationProps {
  onSubmit?: () => void;
  isValid?: boolean;
  formId?: string;
}

export function SurveyNavigation({
  onSubmit,
  isValid = true,
  formId,
}: SurveyNavigationProps) {
  const { state, nextStep, canSkip } = useWizard();
  const { currentStep, isSubmitting } = state;

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isIntroStep = currentStep === 0;

  // Only use handleClick for steps without a form (intro, conditions) or final submit
  const handleClick = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else if (!formId) {
      // Only call nextStep directly if there's no form to submit
      nextStep();
    }
    // If formId is set, the form submission will handle nextStep
  };

  // Check if current condition step has selections
  const hasConditionsSelected = () => {
    // Condition steps are 3-10 (indices 0-7 in CATEGORY_ORDER)
    if (currentStep >= 3 && currentStep <= 10) {
      const categoryIndex = currentStep - 3;
      const category = CATEGORY_ORDER[categoryIndex];
      const conditions = state.data.conditions?.[category] || [];
      return conditions.length > 0;
    }
    return false;
  };

  // Get button text based on step
  const getButtonText = () => {
    if (isIntroStep) return "Comenzar";
    if (isLastStep) return "Enviar evaluación";
    if (canSkip && !hasConditionsSelected()) return "Nada de esto me aplica";
    return "Continuar";
  };

  return (
    <footer className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
      <div className="max-w-lg mx-auto px-4 py-4">
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={handleClick}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              {getButtonText()}
              {isLastStep ? (
                <Send className="ml-2 h-5 w-5" />
              ) : (
                <ArrowRight className="ml-2 h-5 w-5" />
              )}
            </>
          )}
        </Button>

        {/* Skip hint for condition steps */}
        {canSkip && !isLastStep && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Si ninguna opción aplica, puedes continuar
          </p>
        )}
      </div>
    </footer>
  );
}
