import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
}

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: DateTimePickerProps) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    setViewDate((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setViewDate((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateChange(today);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div data-testid="datetime-picker" className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 data-testid="calendar-month" className="text-lg font-semibold">
            {format(viewDate, "MMMM 'de' yyyy", { locale: es })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              data-testid="calendar-prev"
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              data-testid="calendar-today"
              variant="outline"
              onClick={handleToday}
            >
              Hoy
            </Button>
            <Button
              data-testid="calendar-next"
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              aria-label="Siguiente semana"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div data-testid="calendar-grid" className="grid gap-3 md:grid-cols-7">
          {weekDays.map((date) => {
            const isPast = date < today;
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dateStr = format(date, "yyyy-MM-dd");

            return (
              <button
                key={date.toISOString()}
                data-testid={`calendar-day-${dateStr}`}
                onClick={() => !isPast && onDateChange(date)}
                disabled={isPast}
                className={cn(
                  "border rounded-lg p-3 text-center transition-colors",
                  isSelected && "ring-2 ring-primary bg-primary/5",
                  isPast && "opacity-50 cursor-not-allowed",
                  !isPast && !isSelected && "hover:bg-muted/50",
                )}
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {format(date, "EEE", { locale: es })}
                </div>
                <div className="text-2xl font-bold">{format(date, "d")}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div data-testid="time-section" className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 data-testid="time-title" className="font-semibold">
              Selecciona la hora para el{" "}
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
          </div>

          <div
            data-testid="time-slots-grid"
            className="grid grid-cols-4 sm:grid-cols-6 gap-2"
          >
            {timeSlots.map((time) => (
              <button
                key={time}
                data-testid={`time-slot-${time.replace(":", "-")}`}
                onClick={() => onTimeChange(time)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  selectedTime === time
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80",
                )}
              >
                {time}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Label
              htmlFor="custom-time"
              className="text-sm text-muted-foreground"
            >
              Otra hora:
            </Label>
            <Input
              id="custom-time"
              data-testid="custom-time-input"
              type="time"
              value={selectedTime || ""}
              onChange={(e) => e.target.value && onTimeChange(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      )}
    </div>
  );
}
