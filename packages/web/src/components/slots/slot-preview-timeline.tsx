import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SlotStatusDot } from "./slot-status-badge";
import { Clock, ArrowRight } from "lucide-react";

interface SlotPreviewTimelineProps {
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  interval: number; // minutes
  serviceDuration: number; // minutes
  existingSlots?: Array<{ startTime: string; status: string }>;
  className?: string;
}

export function SlotPreviewTimeline({
  startTime,
  endTime,
  interval,
  serviceDuration,
  existingSlots = [],
  className,
}: SlotPreviewTimelineProps) {
  const slots = useMemo(() => {
    const result: Array<{
      time: string;
      endTime: string;
      isExisting: boolean;
      existingStatus?: string;
    }> = [];

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + serviceDuration <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      const endHourCalc = Math.floor((currentMinutes + serviceDuration) / 60);
      const endMinCalc = (currentMinutes + serviceDuration) % 60;
      const endTimeStr = `${endHourCalc.toString().padStart(2, "0")}:${endMinCalc.toString().padStart(2, "0")}`;

      const existingSlot = existingSlots.find((s) => s.startTime === timeStr);

      result.push({
        time: timeStr,
        endTime: endTimeStr,
        isExisting: !!existingSlot,
        existingStatus: existingSlot?.status,
      });

      currentMinutes += interval;
    }

    return result;
  }, [startTime, endTime, interval, serviceDuration, existingSlots]);

  const availableCount = slots.filter((s) => !s.isExisting).length;
  const occupiedCount = slots.filter(
    (s) =>
      s.isExisting &&
      (s.existingStatus === "reserved" ||
        s.existingStatus === "pending_approval"),
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            <Clock className="inline size-3.5 mr-1" />
            Vista previa
          </span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-medium">
              {availableCount} disponibles
            </span>
            {occupiedCount > 0 && (
              <span className="text-amber-600 font-medium">
                {occupiedCount} ocupados
              </span>
            )}
          </div>
        </div>
        <span className="text-muted-foreground">
          {slots.length} slots × {serviceDuration}min
        </span>
      </div>

      {/* Timeline */}
      <div className="flex flex-wrap gap-1.5">
        {slots.map((slot) => {
          const isAvailable = !slot.isExisting;
          const isReserved =
            slot.isExisting &&
            (slot.existingStatus === "reserved" ||
              slot.existingStatus === "pending_approval");
          const isBlocked =
            slot.isExisting && slot.existingStatus === "blocked";

          return (
            <div
              key={slot.time}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200",
                isAvailable &&
                  "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
                isReserved &&
                  "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
                isBlocked &&
                  "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
              )}
            >
              <SlotStatusDot
                variant={
                  isAvailable
                    ? "available"
                    : isReserved
                      ? "reserved"
                      : isBlocked
                        ? "blocked"
                        : "cancelled"
                }
              />
              <span>
                {slot.time} - {slot.endTime}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <SlotStatusDot variant="available" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SlotStatusDot variant="reserved" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SlotStatusDot variant="blocked" />
          <span>Bloqueado</span>
        </div>
      </div>
    </div>
  );
}

// Compact timeline for smaller spaces
interface CompactTimelineProps {
  slots: Array<{ time: string; status: string }>;
  maxVisible?: number;
  className?: string;
}

export function CompactTimeline({
  slots,
  maxVisible = 8,
  className,
}: CompactTimelineProps) {
  const visibleSlots = slots.slice(0, maxVisible);
  const remainingCount = slots.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleSlots.map((slot) => (
        <div
          key={slot.time}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
            slot.status === "available" &&
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
            slot.status === "reserved" &&
              "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            slot.status === "blocked" &&
              "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
          )}
        >
          <SlotStatusDot
            variant={
              slot.status as
                | "available"
                | "reserved"
                | "blocked"
                | "pending_approval"
            }
          />
          <span className="text-xs">{slot.time}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground self-center">
          +{remainingCount} más
        </span>
      )}
    </div>
  );
}

// Summary stats component
interface TimelineSummaryProps {
  available: number;
  reserved: number;
  blocked: number;
  total: number;
}

export function TimelineSummary({
  available,
  reserved,
  blocked,
  total,
}: TimelineSummaryProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-emerald-500" />
        <span className="text-emerald-700 dark:text-emerald-400">
          {available}
        </span>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-amber-500" />
        <span className="text-amber-700 dark:text-amber-400">{reserved}</span>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-red-500" />
        <span className="text-red-700 dark:text-red-400">{blocked}</span>
      </div>
      <span className="text-muted-foreground ml-auto">
        Total: <strong>{total}</strong>
      </span>
    </div>
  );
}
