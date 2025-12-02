import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface FollowUpScheduleCardProps {
  data?: AdvisorNotes["followUpSchedule"];
}

const scheduleLabels: Record<string, string> = {
  day1: "Día 1",
  day3: "Día 3",
  day5: "Día 5",
  day7: "Día 7",
};

const scheduleIcons: Record<string, string> = {
  day1: "📞",
  day3: "💬",
  day5: "📱",
  day7: "🎥",
};

export function FollowUpScheduleCard({ data }: FollowUpScheduleCardProps) {
  // Validación defensiva: verificar que data tenga al menos una propiedad
  const isDataComplete = data && Object.keys(data).length > 0;

  if (!isDataComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📞</span> Calendario de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const schedule = Object.entries(data) as [
    keyof typeof scheduleLabels,
    string,
  ][];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📞</span> Calendario de Seguimiento
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Cuándo y cómo contactar al cliente
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />

          <div className="space-y-4">
            {schedule.map(([dayKey, content], index) => (
              <div key={dayKey} className="flex items-start gap-4 relative">
                {/* Timeline dot */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10 flex-shrink-0">
                  <span className="text-sm">{scheduleIcons[dayKey]}</span>
                </div>

                <div className="flex-1 pb-2">
                  <div className="text-xs font-medium text-primary uppercase">
                    {scheduleLabels[dayKey]}
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">
                    {content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
