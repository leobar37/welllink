import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClientRecommendations } from "../schema";

interface DietCardProps {
  data?: ClientRecommendations["diet"];
}

export function DietCard({ data }: DietCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🍎</span> Alimentación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-muted rounded" />
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
          <span>🍎</span> Alimentación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.avoid && data.avoid.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
              ❌ Evitar
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.avoid.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.recommended && data.recommended.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-600 flex items-center gap-1">
              ✅ Recomendados
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.recommended.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.supplements && data.supplements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-600 flex items-center gap-1">
              💊 Suplementos sugeridos
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.supplements.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.mealFrequency && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">🍽️ Frecuencia: </span>
            <span className="text-sm">{data.mealFrequency}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
