import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ClientRecommendations } from "../schema";

interface WellnessScoreCardProps {
  data?: ClientRecommendations["wellnessScore"];
}

const categoryLabels: Record<string, string> = {
  digestivo: "Digestivo",
  cardiovascular: "Cardiovascular",
  energia: "Energía",
  inmune: "Inmune",
  muscular: "Muscular",
  hormonal: "Hormonal",
  piel: "Piel",
  otros: "Otros",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function WellnessScoreCard({ data }: WellnessScoreCardProps) {
  // Validación defensiva: verificar que data y sus propiedades requeridas existan
  const isDataComplete =
    data && typeof data.overall === "number" && data.byCategory !== undefined;

  if (!isDataComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span> Wellness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span> Wellness Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(data.overall)}`}>
            {data.overall}
          </div>
          <div className="text-muted-foreground text-sm">de 100</div>
          <p className="mt-2 text-sm text-muted-foreground">{data.trend}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Por categoría</h4>
          {Object.entries(data.byCategory).map(([category, score]) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{categoryLabels[category] || category}</span>
                <span className={getScoreColor(score)}>{score}</span>
              </div>
              <Progress
                value={score}
                className={`h-2 [&>div]:${getProgressColor(score)}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
