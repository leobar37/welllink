import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface AlertSignsCardProps {
  data?: AdvisorNotes["alertSigns"];
}

export function AlertSignsCard({ data }: AlertSignsCardProps) {
  if (!data) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <span>🚨</span> Señales de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
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
            <span>🚨</span> Señales de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No se identificaron señales de alerta especiales
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader className="bg-red-50 dark:bg-red-950 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span>🚨</span> Señales de Alerta
        </CardTitle>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Monitorear durante el reto
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {data.map((alert, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/50 rounded-lg"
          >
            <span className="text-red-600 text-sm mt-0.5">•</span>
            <span className="text-sm">{alert}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
