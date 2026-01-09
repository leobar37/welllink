import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";
import { SurveyCard } from "./SurveyCard";
import { useHealthSurveys } from "@/hooks/use-health-surveys";
import { useSurveyToClient } from "@/hooks/use-survey-to-client";

export function HealthSurveysList() {
  const { surveys, isLoading } = useHealthSurveys();
  const { convertToClient, bulkConvertToClients } = useSurveyToClient();
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);

  const handleConvertSingle = (surveyId: string) => {
    convertToClient.mutate(surveyId);
  };

  const handleBulkConvert = () => {
    if (selectedSurveys.length > 0) {
      bulkConvertToClients.mutate(selectedSurveys);
      setSelectedSurveys([]);
    }
  };

  const toggleSurveySelection = (surveyId: string) => {
    setSelectedSurveys((prev) =>
      prev.includes(surveyId)
        ? prev.filter((id) => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {surveys && surveys.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Encuestas ({surveys.length})
          </h2>
          {selectedSurveys.length > 0 && (
            <Button
              onClick={handleBulkConvert}
              disabled={bulkConvertToClients.isPending}
            >
              {bulkConvertToClients.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convertir ({selectedSurveys.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {surveys && surveys.length > 0 ? (
          surveys.map((survey) => (
            <div key={survey.id} className="flex items-start gap-3">
              <Checkbox
                checked={selectedSurveys.includes(survey.id)}
                onCheckedChange={() => toggleSurveySelection(survey.id)}
                className="mt-2"
              />
              <SurveyCard
                survey={survey}
                onConvert={handleConvertSingle}
                isConverting={convertToClient.isPending}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            No hay encuestas de salud registradas aún.
          </div>
        )}
      </div>
    </div>
  );
}
