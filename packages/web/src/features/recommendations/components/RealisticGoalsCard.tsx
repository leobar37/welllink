import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface RealisticGoalsCardProps {
  data?: AdvisorNotes["realisticGoals"];
}

export function RealisticGoalsCard({ data }: RealisticGoalsCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span> Metas Realistas
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
            <span>🎯</span> Metas Realistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No se definieron metas específicas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span> Metas Realistas
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Expectativas a comunicar al cliente
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((goal, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/50 rounded-lg"
          >
            <span className="text-green-600 text-sm mt-0.5">✓</span>
            <span className="text-sm">{goal}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
