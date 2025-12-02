import type { ClientRecommendations } from "../schema";
import { WellnessScoreCard } from "./WellnessScoreCard";
import { HydrationCard } from "./HydrationCard";
import { BMICard } from "./BMICard";
import { DietCard } from "./DietCard";
import { ExerciseCard } from "./ExerciseCard";
import { SupplementsCard } from "./SupplementsCard";
import { ConditionsCard } from "./ConditionsCard";
import { RiskFactorsCard } from "./RiskFactorsCard";

interface ClientTabProps {
  data?: ClientRecommendations;
}

export function ClientTab({ data }: ClientTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {data?.summary && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">📋 Resumen</h3>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>
      )}

      {/* Score and Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WellnessScoreCard data={data?.wellnessScore} />
        <BMICard data={data?.bmi} />
        <HydrationCard data={data?.hydration} />
      </div>

      {/* Health Info Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <ConditionsCard data={data?.prioritizedConditions} />
        <RiskFactorsCard data={data?.riskFactors} />
      </div>

      {/* Recommendations Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <DietCard data={data?.diet} />
        <ExerciseCard data={data?.exercise} />
      </div>

      {/* Supplements - Full Width */}
      <SupplementsCard data={data?.supplementsRoutine} />
    </div>
  );
}
