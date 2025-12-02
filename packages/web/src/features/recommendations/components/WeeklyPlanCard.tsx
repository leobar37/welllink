import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface WeeklyPlanCardProps {
  data?: AdvisorNotes["weeklyPlan"];
}

const dayLabels: Record<string, string> = {
  day1: "Día 1",
  day2: "Día 2",
  day3: "Día 3",
  day4: "Día 4",
  day5: "Día 5",
  day6: "Día 6",
  day7: "Día 7",
};

const dayIcons: Record<string, string> = {
  day1: "1️⃣",
  day2: "2️⃣",
  day3: "3️⃣",
  day4: "4️⃣",
  day5: "5️⃣",
  day6: "6️⃣",
  day7: "7️⃣",
};

export function WeeklyPlanCard({ data }: WeeklyPlanCardProps) {
  // Validación defensiva: verificar que data tenga al menos una propiedad
  const isDataComplete = data && Object.keys(data).length > 0;

  if (!isDataComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📅</span> Plan Semanal de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const days = Object.entries(data) as [keyof typeof dayLabels, string][];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📅</span> Plan Semanal de Seguimiento
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Acciones sugeridas para cada día del reto
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.map(([dayKey, content]) => (
          <div
            key={dayKey}
            className="flex items-start gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <span className="text-lg flex-shrink-0">{dayIcons[dayKey]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                {dayLabels[dayKey]}
              </div>
              <div className="text-sm mt-1">{content}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
