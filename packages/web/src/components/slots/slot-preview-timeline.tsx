import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";
import { SlotStatusDot } from "./slot-status-badge";

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

  // Group by hour
  const groupedSlots = useMemo(() => {
    const grouped: Record<number, typeof slots> = {};
    slots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(slot);
    });
    return grouped;
  }, [slots]);

  const availableCount = slots.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5" />
          <span>
            {availableCount} slots por día
          </span>
        </div>
        <span>
          {serviceDuration} min / slot
        </span>
      </div>

      {/* Grouped Timeline */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {Object.entries(groupedSlots).map(([hour, hourSlots]) => (
          <div key={hour} className="flex gap-2 text-sm">
            <div className="w-10 text-xs font-medium text-muted-foreground pt-1.5 shrink-0 text-right">
              {hour}:00
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {hourSlots.map((slot) => (
                <div
                  key={slot.time}
                  className={cn(
                    "px-2 py-1 rounded bg-secondary/50 text-secondary-foreground text-xs border border-transparent hover:border-primary/20 transition-colors cursor-default",
                  )}
                  title={`${slot.time} - ${slot.endTime}`}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>
        ))}
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
