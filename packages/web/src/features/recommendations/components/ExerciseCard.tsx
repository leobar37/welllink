import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRecommendations } from "../schema";

interface ExerciseCardProps {
  data?: ClientRecommendations["exercise"];
}

export function ExerciseCard({ data }: ExerciseCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏃</span> Actividad Física
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏃</span> Actividad Física
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {data.type && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <span className="text-lg">🎯</span>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Tipo</div>
                <div className="font-medium">{data.type}</div>
              </div>
            </div>
          )}

          {data.intensity && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <span className="text-lg">⚡</span>
              <div>
                <div className="text-xs text-muted-foreground uppercase">
                  Intensidad
                </div>
                <div className="font-medium">{data.intensity}</div>
              </div>
            </div>
          )}

          {data.frequency && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <span className="text-lg">📅</span>
              <div>
                <div className="text-xs text-muted-foreground uppercase">
                  Frecuencia
                </div>
                <div className="font-medium">{data.frequency}</div>
              </div>
            </div>
          )}
        </div>

        {data.precautions && data.precautions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-600 flex items-center gap-1">
              ⚠️ Precauciones
            </h4>
            <ul className="space-y-1">
              {data.precautions.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 p-2 rounded"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
