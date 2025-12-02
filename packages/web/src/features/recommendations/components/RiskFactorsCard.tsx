import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRecommendations } from "../schema";

interface RiskFactorsCardProps {
  data?: ClientRecommendations["riskFactors"];
}

export function RiskFactorsCard({ data }: RiskFactorsCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚠️</span> Factores de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚠️</span> Factores de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-muted-foreground">
              No se identificaron factores de riesgo significativos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>⚠️</span> Factores de Riesgo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((risk, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800"
          >
            <div className="font-medium text-orange-700 dark:text-orange-300 text-sm">
              {risk.factor}
            </div>
            <div className="mt-2 flex items-start gap-2">
              <span className="text-green-600 text-sm">→</span>
              <span className="text-sm text-muted-foreground">{risk.action}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
