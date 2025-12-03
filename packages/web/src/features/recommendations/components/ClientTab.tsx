import type { ClientRecommendations } from "../schema";
import { WellnessScoreCard } from "./WellnessScoreCard";
import { HydrationCard } from "./HydrationCard";
import { BMICard } from "./BMICard";
import { DietCard } from "./DietCard";
import { ExerciseCard } from "./ExerciseCard";
import { SupplementsCard } from "./SupplementsCard";
import { ConditionsCard } from "./ConditionsCard";
import { RiskFactorsCard } from "./RiskFactorsCard";
import { SectionNav } from "./SectionNav";
import { CLIENT_SECTIONS } from "../constants";

interface ClientTabProps {
  data?: ClientRecommendations;
}

export function ClientTab({ data }: ClientTabProps) {
  return (
    <div className="space-y-4">
      {/* Sticky Section Navigation */}
      <SectionNav sections={CLIENT_SECTIONS} />

      {/* Summary Section */}
      <section id="client-summary" className="scroll-mt-16 pt-2">
        {data?.summary && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <span>📋</span> Resumen
            </h3>
            <p className="text-sm text-muted-foreground">{data.summary}</p>
          </div>
        )}
      </section>

      {/* Metrics Section */}
      <section id="client-metrics" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>📊</span> Métricas de Salud
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WellnessScoreCard data={data?.wellnessScore} />
          <BMICard data={data?.bmi} />
          <HydrationCard data={data?.hydration} />
        </div>
      </section>

      {/* Health Section */}
      <section id="client-health" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>🩺</span> Estado de Salud
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConditionsCard data={data?.prioritizedConditions} />
          <RiskFactorsCard data={data?.riskFactors} />
        </div>
      </section>

      {/* Nutrition Section */}
      <section id="client-nutrition" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>🍎</span> Nutrición y Ejercicio
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DietCard data={data?.diet} />
          <ExerciseCard data={data?.exercise} />
        </div>
      </section>

      {/* Supplements Section */}
      <section id="client-supplements" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>💊</span> Plan de Suplementación
        </h3>
        <SupplementsCard data={data?.supplementsRoutine} />
      </section>
    </div>
  );
}
