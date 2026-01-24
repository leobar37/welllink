import { useState } from "react";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeekNavigatorProps {
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  className?: string;
}

export function WeekNavigator({
  currentWeekStart,
  onWeekChange,
  className,
}: WeekNavigatorProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    onWeekChange(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    onWeekChange(addDays(currentWeekStart, 7));
  };

  const handleToday = () => {
    onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = isWithinInterval(new Date(), {
    start: currentWeekStart,
    end: weekEnd,
  });

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Week label */}
      <div className="flex items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" />
        <span className="text-lg font-semibold capitalize">
          {format(currentWeekStart, "LLLL d", { locale: es })} -{" "}
          {format(weekEnd, "LLLL d, yyyy", { locale: es })}
        </span>
        {isCurrentWeek && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Esta semana
          </span>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousWeek}
          className="hover:bg-accent"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant={isCurrentWeek ? "default" : "outline"}
          onClick={handleToday}
          className="min-w-[80px]"
        >
          <Calendar className="size-4 mr-1.5" />
          Hoy
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="hover:bg-accent"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Mini week selector with month view
interface MiniWeekSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function MiniWeekSelector({
  selectedDate,
  onDateSelect,
  className,
}: MiniWeekSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: es });

  const handlePrevMonth = () => {
    setCurrentMonth(addDays(currentMonth, -30));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addDays(currentMonth, 30));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-medium capitalize">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium text-muted-foreground py-1",
              i === 6 && "text-red-500 dark:text-red-400",
            )}
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "aspect-square flex items-center justify-center rounded-md text-sm transition-all",
                isSelected && "bg-primary text-primary-foreground font-medium",
                !isSelected && "hover:bg-accent",
                isDayToday && !isSelected && "border border-primary/50",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Week strip for horizontal scrolling
interface WeekStripProps {
  currentWeekStart: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function WeekStrip({
  currentWeekStart,
  selectedDate,
  onDateSelect,
  className,
}: WeekStripProps) {
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i),
  );

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {days.map((day, i) => {
        const isSelected = isSameDay(day, selectedDate);
        const isDayToday = isToday(day);
        const isWeekend = i >= 5;

        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px]",
              isSelected && "bg-primary text-primary-foreground",
              !isSelected && "hover:bg-accent",
              isDayToday && !isSelected && "border-2 border-primary/50",
            )}
          >
            <span
              className={cn(
                "text-xs font-medium",
                isWeekend && !isSelected && "text-red-500 dark:text-red-400",
              )}
            >
              {dayNames[i]}
            </span>
            <span
              className={cn(
                "text-lg font-semibold",
                isDayToday && !isSelected && "text-primary",
              )}
            >
              {format(day, "d")}
            </span>
            {isDayToday && (
              <span className="text-[10px] uppercase tracking-wider">Hoy</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
