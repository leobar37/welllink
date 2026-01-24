import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarAIPart, AIUIHandlers } from "./types";

interface CalendarPartProps {
  part: CalendarAIPart;
  handlers: AIUIHandlers;
}

export const CalendarPart = memo(({ part, handlers }: CalendarPartProps) => {
  const today = new Date();
  const minDate = part.minDate ? new Date(part.minDate) : today;
  const maxDate = part.maxDate
    ? new Date(part.maxDate)
    : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dates: Date[] = [];
  const current = new Date(minDate);
  while (current <= maxDate && dates.length < 14) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-3 my-4">
      <p className="text-sm font-medium text-muted-foreground">
        Selecciona una fecha:
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const dateStr = formatDate(date);
          const isSelected = part.selectedDate === dateStr;
          const isPast = date < today;

          return (
            <Button
              key={dateStr}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-shrink-0 flex-col h-auto py-2 px-3",
                isPast && "opacity-50 cursor-not-allowed",
              )}
              disabled={isPast}
              onClick={() =>
                !isPast && handlers.onSelectDate?.(dateStr, part.serviceId)
              }
            >
              <span className="text-xs text-muted-foreground">
                {date.toLocaleDateString("es-MX", { weekday: "short" })}
              </span>
              <span className="font-medium">{date.getDate()}</span>
              <span className="text-xs text-muted-foreground">
                {date.toLocaleDateString("es-MX", { month: "short" })}
              </span>
            </Button>
          );
        })}
      </div>
      {part.selectedDate && (
        <p className="text-sm text-primary font-medium">
          Fecha seleccionada:{" "}
          {new Date(part.selectedDate).toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
});

CalendarPart.displayName = "CalendarPart";

export default CalendarPart;
