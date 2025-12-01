import { ArrowRight, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWizard } from "./WizardContext"
import { TOTAL_STEPS } from "@/lib/survey/constants"

interface SurveyNavigationProps {
  onSubmit?: () => void
  isValid?: boolean
}

export function SurveyNavigation({ onSubmit, isValid = true }: SurveyNavigationProps) {
  const { state, nextStep, canSkip, currentStepConfig } = useWizard()
  const { currentStep, isSubmitting } = state

  const isLastStep = currentStep === TOTAL_STEPS - 1
  const isIntroStep = currentStep === 0

  const handleClick = () => {
    if (isLastStep && onSubmit) {
      onSubmit()
    } else {
      nextStep()
    }
  }

  // Get button text based on step
  const getButtonText = () => {
    if (isIntroStep) return "Comenzar"
    if (isLastStep) return "Enviar por WhatsApp"
    if (canSkip) return "Nada de esto me aplica"
    return "Continuar"
  }

  return (
    <footer className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
      <div className="max-w-lg mx-auto px-4 py-4">
        <Button
          type={isLastStep ? "button" : "submit"}
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
  )
}
