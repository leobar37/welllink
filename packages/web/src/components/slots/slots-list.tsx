import { useMemo } from "react";
import { format } from "date-fns";
import { Loader2, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SlotCard, DaySlotHeader } from "./slot-card";
import { SlotStatusBanner } from "./slot-status-badge";
import type { TimeSlot } from "@/hooks/use-slots";

interface SlotsListProps {
  slots: TimeSlot[];
  isLoading?: boolean;
  onBlock?: (slotId: string) => void;
  onUnblock?: (slotId: string) => void;
  onDelete?: (slotId: string) => void;
  onEdit?: (slot: TimeSlot) => void;
  onViewClient?: (slot: TimeSlot) => void;
  className?: string;
}

interface DayGroup {
  date: Date;
  slots: TimeSlot[];
}

interface GroupedResult {
  groupedSlots: DayGroup[];
  stats: {
    available: number;
    reserved: number;
    blocked: number;
    total: number;
  };
}

export function SlotsList({
  slots,
  isLoading = false,
  onBlock,
  onUnblock,
  onDelete,
  onEdit,
  onViewClient,
  className,
}: SlotsListProps) {
  // Group and sort slots
  const { groupedSlots, stats }: GroupedResult = useMemo(() => {
    const grouped = slots.reduce(
      (acc, slot) => {
        const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(slot);
        return acc;
      },
      {} as Record<string, TimeSlot[]>,
    );

    // Sort by date
    const sortedDates = Object.keys(grouped).sort();

    // Calculate stats
    let available = 0;
    let reserved = 0;
    let blocked = 0;

    slots.forEach((s) => {
      if (s.status === "available") available++;
      else if (s.status === "reserved" || s.status === "pending_approval")
        reserved++;
      else if (s.status === "blocked") blocked++;
    });

    return {
      groupedSlots: sortedDates.map((dateKey) => ({
        date: new Date(grouped[dateKey][0].startTime),
        slots: grouped[dateKey].sort(
          (a: TimeSlot, b: TimeSlot) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      })),
      stats: { available, reserved, blocked, total: slots.length },
    };
  }, [slots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No hay slots configurados
        </h3>
        <p className="text-muted-foreground mb-4">
          Genera horarios disponibles para comenzar a recibir reservas
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="flex items-center gap-3">
        <SlotStatusBanner variant="available" count={stats.available} />
        <SlotStatusBanner variant="reserved" count={stats.reserved} />
        <SlotStatusBanner variant="blocked" count={stats.blocked} />
        <div className="ml-auto text-sm text-muted-foreground">
          Total: <strong>{stats.total}</strong> slots
        </div>
      </div>

      {/* Slots by day */}
      {groupedSlots.map(({ date, slots: daySlots }) => {
        const dayAvailable = daySlots.filter(
          (s) => s.status === "available",
        ).length;
        const dayReserved = daySlots.filter(
          (s) => s.status === "reserved" || s.status === "pending_approval",
        ).length;

        return (
          <Card key={date.toISOString()}>
            <CardHeader className="px-6 py-3 border-b">
              <DaySlotHeader
                date={date}
                slotCount={daySlots.length}
                availableCount={dayAvailable}
                reservedCount={dayReserved}
              />
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {daySlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onBlock={onBlock}
                  onUnblock={onUnblock}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onViewClient={onViewClient}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Compact slots list for sidebar/small spaces
interface CompactSlotsListProps {
  slots: TimeSlot[];
  maxVisible?: number;
  onSlotClick?: (slot: TimeSlot) => void;
  className?: string;
}

export function CompactSlotsList({
  slots,
  maxVisible = 5,
  onSlotClick,
  className,
}: CompactSlotsListProps) {
  const visibleSlots = slots
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, maxVisible);

  if (slots.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-4 text-muted-foreground text-sm",
          className,
        )}
      >
        No hay slots disponibles
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {visibleSlots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => onSlotClick?.(slot)}
          className={cn(
            "flex items-center justify-between w-full p-2 rounded-md text-left transition-all",
            slot.status === "available"
              ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20"
              : slot.status === "reserved"
                ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20"
                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20",
          )}
        >
          <span className="text-sm font-medium">
            {format(new Date(slot.startTime), "HH:mm")}
          </span>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              slot.status === "available"
                ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                : slot.status === "reserved"
                  ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                  : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
            )}
          >
            {slot.status === "available"
              ? "Libre"
              : slot.status === "reserved"
                ? "Reservado"
                : "Bloqueado"}
          </span>
        </button>
      ))}
      {slots.length > maxVisible && (
        <button className="w-full text-center text-sm text-primary hover:underline py-1">
          Ver {slots.length - maxVisible} más...
        </button>
      )}
    </div>
  );
}

// Empty state component
interface EmptySlotsStateProps {
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export function EmptySlotsState({
  onGenerate,
  isGenerating = false,
}: EmptySlotsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <CalendarDays className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No hay slots configurados</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        Genera horarios disponibles para permitir que los clientes reserven
        citas contigo.
      </p>
      {onGenerate && (
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generar Slots
            </>
          )}
        </Button>
      )}
    </div>
  );
}
