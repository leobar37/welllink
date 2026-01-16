import { Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimeSlot } from "@/hooks/use-slots";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SlotsListProps {
  slots: TimeSlot[];
  isLoading?: boolean;
  onBlock?: (slotId: string) => void;
  onUnblock?: (slotId: string) => void;
  onDelete?: (slotId: string) => void;
}

export function SlotsList({
  slots,
  isLoading = false,
  onBlock,
  onUnblock,
  onDelete,
}: SlotsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        No hay slots configurados para este período.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary">Disponible</Badge>;
      case "pending_approval":
        return <Badge variant="outline">Pendiente</Badge>;
      case "reserved":
        return <Badge variant="default">Reservado</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloqueado</Badge>;
      case "expired":
        return <Badge variant="outline">Expirado</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Sort by date
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const daySlots = groupedSlots[dateKey];
        const date = new Date(daySlots[0].startTime);

        return (
          <div key={dateKey} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <div className="grid gap-2">
              {daySlots.map((slot) => (
                <Card key={slot.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {format(new Date(slot.startTime), "HH:mm")} -{" "}
                          {format(new Date(slot.endTime), "HH:mm")}
                        </span>
                        {getStatusBadge(slot.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {slot.currentReservations}/{slot.maxReservations} reservas
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {slot.status === "available" && onBlock && (
                          <DropdownMenuItem onClick={() => onBlock(slot.id)}>
                            Bloquear
                          </DropdownMenuItem>
                        )}
                        {slot.status === "blocked" && onUnblock && (
                          <DropdownMenuItem onClick={() => onUnblock(slot.id)}>
                            Desbloquear
                          </DropdownMenuItem>
                        )}
                        {slot.status !== "reserved" &&
                          slot.status !== "pending_approval" &&
                          onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(slot.id)}
                              className="text-destructive"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
