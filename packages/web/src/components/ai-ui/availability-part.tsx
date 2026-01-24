import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailabilityAIPart, AIUIHandlers, SlotData } from "./types";

interface AvailabilityPartProps {
  part: AvailabilityAIPart;
  handlers: AIUIHandlers;
}

export const AvailabilityPart = memo(
  ({ part, handlers }: AvailabilityPartProps) => {
    return (
      <div className="space-y-3 my-4">
        <p className="text-sm font-medium text-muted-foreground">
          Horarios disponibles para {part.date}:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {part.slots.map((slot) => (
            <SlotButton
              key={slot.id}
              slot={slot}
              onSelect={handlers.onSelectSlot}
              date={part.date}
              serviceId={part.serviceId}
            />
          ))}
        </div>
        {part.slots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay horarios disponibles para esta fecha
          </p>
        )}
      </div>
    );
  },
);

interface SlotButtonProps {
  slot: SlotData;
  date: string;
  serviceId?: string;
  onSelect?: (slot: SlotData, date: string, serviceId?: string) => void;
}

const SlotButton = memo(
  ({ slot, date, serviceId, onSelect }: SlotButtonProps) => {
    const time = new Date(slot.startTime).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Button
        variant="outline"
        className={cn(
          "w-full",
          slot.available > 0 &&
            "hover:bg-primary hover:text-primary-foreground",
        )}
        disabled={slot.available === 0}
        onClick={() => onSelect?.(slot, date, serviceId)}
      >
        <Clock className="w-3 h-3 mr-1" />
        {time}
        {slot.available < slot.maxReservations && slot.available > 0 && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {slot.available}
          </Badge>
        )}
      </Button>
    );
  },
);

SlotButton.displayName = "SlotButton";
AvailabilityPart.displayName = "AvailabilityPart";

export default AvailabilityPart;
