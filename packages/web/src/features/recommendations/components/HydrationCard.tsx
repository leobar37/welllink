import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRecommendations } from "../schema";

interface HydrationCardProps {
  data?: ClientRecommendations["hydration"];
}

export function HydrationCard({ data }: HydrationCardProps) {
  // Validación defensiva: verificar que data y dailyLiters existan
  const isDataComplete = data && typeof data.dailyLiters === "number";

  if (!isDataComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💧</span> Hidratación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
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
          <span>💧</span> Hidratación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {data.dailyLiters}L
          </div>
          <div className="text-muted-foreground text-sm">
            diarios recomendados
          </div>
        </div>

        {data.formula && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Fórmula: {data.formula}
          </div>
        )}

        {data.comparison && (
          <p className="text-sm text-muted-foreground">{data.comparison}</p>
        )}

        {data.schedule && data.schedule.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Horario sugerido</h4>
            <ul className="space-y-1">
              {data.schedule.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.alerts && data.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-600">Alertas</h4>
            <ul className="space-y-1">
              {data.alerts.map((alert, index) => (
                <li
                  key={index}
                  className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded"
                >
                  ⚠️ {alert}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
