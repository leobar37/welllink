import { Badge } from "@/components/ui/badge";
import { useWizard } from "../wizard/WizardContext";
import { ConditionTile } from "../ui/ConditionTile";
import { SurveyNavigation } from "../wizard/SurveyNavigation";
import { CONDITIONS, CATEGORY_META } from "@/lib/survey/constants";
import type { ConditionCategory } from "@/lib/survey/schema";

interface StepConditionsProps {
  category: ConditionCategory;
}

export function StepConditions({ category }: StepConditionsProps) {
  const { state, toggleCondition, nextStep } = useWizard();

  const meta = CATEGORY_META[category];
  const conditions = CONDITIONS[category];
  const selectedConditions = state.data.conditions?.[category] || [];

  const handleToggle = (condition: string) => {
    toggleCondition(category, condition);
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <div className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl" role="img" aria-hidden="true">
                {meta.icon}
              </span>
              <h2 className="text-xl font-semibold leading-none">
                {meta.friendlyName}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              {meta.description}
            </p>
            {selectedConditions.length > 0 && (
              <Badge variant="secondary" className="w-fit mt-2">
                {selectedConditions.length} seleccionada
                {selectedConditions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <fieldset>
            <legend className="sr-only">
              Selecciona las condiciones de {meta.friendlyName} que aplican
            </legend>

            <div className="grid grid-cols-1 gap-3">
              {conditions.map((condition) => (
                <ConditionTile
                  key={condition}
                  condition={condition}
                  isSelected={selectedConditions.includes(condition)}
                  onToggle={() => handleToggle(condition)}
                />
              ))}
            </div>
          </fieldset>

          {/* Helpful hint */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Selecciona todas las que apliquen o continúa si ninguna aplica
          </p>
        </div>
      </div>

      <SurveyNavigation onSubmit={handleContinue} />
    </div>
  );
}
