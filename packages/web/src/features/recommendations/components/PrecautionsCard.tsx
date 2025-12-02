import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface PrecautionsCardProps {
  data?: AdvisorNotes["precautions"];
}

export function PrecautionsCard({ data }: PrecautionsCardProps) {
  if (!data) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <span>⚠️</span> Precauciones con este Cliente
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
            <span>⚠️</span> Precauciones con este Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No se identificaron precauciones especiales
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-amber-50 dark:bg-amber-950 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <span>⚠️</span> Precauciones con este Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {data.map((precaution, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg"
          >
            <span className="text-amber-600 text-sm mt-0.5">•</span>
            <span className="text-sm">{precaution}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
