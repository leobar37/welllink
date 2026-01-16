import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { PublicSlot } from "@/hooks/use-booking";
import { cn } from "@/lib/utils";

interface SlotCalendarProps {
  slots: PublicSlot[];
  isLoading?: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedSlot?: PublicSlot;
  onSlotSelect?: (slot: PublicSlot) => void;
  onMonthChange?: (date: Date) => void;
}

export function SlotCalendar({
  slots,
  isLoading = false,
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotSelect,
  onMonthChange,
}: SlotCalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    const newDate = addDays(viewDate, -7);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addDays(viewDate, 7);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateChange(today);
    onMonthChange?.(today);
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, date);
    });
  };

  const handleSlotClick = (slot: PublicSlot) => {
    onSlotSelect?.(slot);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(viewDate, "MMMM 'de' yyyy", { locale: es })}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid gap-3 md:grid-cols-7">
        {weekDays.map((date) => {
          const daySlots = getSlotsForDate(date);
          const isPast = date < new Date().setHours(0, 0, 0, 0);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "border rounded-lg p-3 min-h-[120px] cursor-pointer transition-colors",
                isSelected && "ring-2 ring-primary",
                isPast && "opacity-50",
                !isPast && "hover:bg-muted/50"
              )}
              onClick={() => !isPast && onDateChange(date)}
            >
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(date, "EEE", { locale: es })}
                  </div>
                  <div className="text-2xl font-bold">
                    {format(date, "d")}
                  </div>
                </div>

                <div className="space-y-1">
                  {daySlots.length > 0 ? (
                    daySlots.map((slot) => {
                      const slotTime = format(new Date(slot.startTime), "HH:mm");
                      const isSlotSelected = selectedSlot?.id === slot.id;
                      const isFull = slot.currentReservations >= slot.maxReservations;

                      return (
                        <button
                          key={slot.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isFull) {
                              handleSlotClick(slot);
                            }
                          }}
                          disabled={isFull}
                          className={cn(
                            "w-full text-xs px-2 py-1 rounded transition-colors",
                            isSlotSelected && "bg-primary text-primary-foreground",
                            !isSlotSelected && !isFull && "bg-secondary hover:bg-secondary/80",
                            isFull && "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          )}
                        >
                          {slotTime}
                          {isFull && " (lleno)"}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="border rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Horario seleccionado</p>
              <p className="text-lg font-semibold">
                {format(new Date(selectedSlot.startTime), "EEEE, d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm">
                {format(new Date(selectedSlot.startTime), "HH:mm")} -{" "}
                {format(new Date(selectedSlot.endTime), "HH:mm")}
              </p>
            </div>
            <Badge variant={selectedSlot.status === "available" ? "default" : "secondary"}>
              {selectedSlot.status === "available" ? "Disponible" : "No disponible"}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
