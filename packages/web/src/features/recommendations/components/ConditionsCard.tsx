import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClientRecommendations } from "../schema";

interface ConditionsCardProps {
  data?: ClientRecommendations["prioritizedConditions"];
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "alta":
      return {
        bg: "bg-red-50 dark:bg-red-950",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-300",
        badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      };
    case "media":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-950",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-300",
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      };
    default:
      return {
        bg: "bg-green-50 dark:bg-green-950",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-300",
        badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      };
  }
}

export function ConditionsCard({ data }: ConditionsCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🩺</span> Condiciones Prioritarias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
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
            <span>🩺</span> Condiciones Prioritarias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No se identificaron condiciones prioritarias
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🩺</span> Condiciones Prioritarias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((condition, index) => {
          const style = getSeverityStyle(condition.severity);
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className={`font-medium ${style.text}`}>
                    {condition.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Categoría: {condition.category}
                  </div>
                </div>
                <Badge className={style.badge} variant="secondary">
                  {condition.severity}
                </Badge>
              </div>
              {condition.relatedTo && condition.relatedTo.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">
                    Relacionado con:
                  </span>
                  {condition.relatedTo.map((related, i) => (
                    <span key={i} className="text-xs text-muted-foreground">
                      {related}
                      {i < condition.relatedTo.length - 1 ? "," : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
