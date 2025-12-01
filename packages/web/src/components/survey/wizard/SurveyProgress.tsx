import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useWizard } from "./WizardContext"

export function SurveyProgress() {
  const { percentage, canGoBack, canSkip, prevStep, nextStep, currentStepConfig } = useWizard()

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={!canGoBack}
            aria-label="Volver al paso anterior"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <span
            className="text-sm font-medium text-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {percentage}%
          </span>

          {canSkip ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={nextStep}
              className="text-muted-foreground hover:text-foreground h-9"
            >
              Saltar
            </Button>
          ) : (
            <div className="w-[60px]" /> // Spacer for alignment
          )}
        </div>

        <Progress
          value={percentage}
          className="h-2"
          aria-label={`Progreso de la encuesta: ${percentage}%`}
        />

        {/* Screen reader announcement for step changes */}
        <div className="sr-only" role="status" aria-live="polite">
          {currentStepConfig?.title}
        </div>
      </div>
    </header>
  )
}
