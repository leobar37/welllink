import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PreviewSlotResult } from "@/hooks/use-availability-rules";
import { getDayName } from "@/hooks/use-availability-rules";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AvailabilityPreviewProps {
  data: PreviewSlotResult[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AvailabilityPreview({
  data,
  isLoading = false,
  onRefresh,
}: AvailabilityPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay slots configurados para este período</p>
      </div>
    );
  }

  // Group by date
  const groupedByDate = data.reduce((acc, slot) => {
    const dateKey = format(new Date(slot.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, PreviewSlotResult[]>);

  // Sort by date
  const sortedDates = Object.keys(groupedByDate).sort();

  // Calculate total slots
  const totalSlots = data.reduce((sum, slot) => sum + slot.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardDescription>Previsualización de slots</CardDescription>
          <p className="text-2xl font-bold">{totalSlots} slots</p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Actualizar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sortedDates.map((dateKey) => {
          const slots = groupedByDate[dateKey];
          const date = new Date(slots[0].date);
          const dayTotal = slots.reduce((sum, s) => sum + s.count, 0);

          return (
            <div key={dateKey} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {dayTotal} slots
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {slots.map((slot, index) => (
                  <div
                    key={`${dateKey}-${index}`}
                    className="text-xs p-2 bg-muted rounded"
                  >
                    <div className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-muted-foreground">
                      {slot.count} {slot.count === 1 ? "cita" : "citas"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
