import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReservationAIPart, AIUIHandlers } from "./types";

interface ReservationPartProps {
  part: ReservationAIPart;
  handlers: AIUIHandlers;
}

export const ReservationPart = memo(
  ({ part, handlers }: ReservationPartProps) => {
    const { reservation } = part;

    return (
      <div className="space-y-3 my-4">
        <Card
          className={cn(
            "border-l-4",
            reservation.status === "pending" && "border-l-yellow-500",
            reservation.status === "confirmed" && "border-l-green-500",
            reservation.status === "rejected" && "border-l-red-500",
          )}
        >
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {reservation.status === "pending"
                  ? "⏳ Solicitud Pendiente"
                  : reservation.status === "confirmed"
                    ? "✅ Cita Confirmada"
                    : "❌ Solicitud Rechazada"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{reservation.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{reservation.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Servicio:</span>
              <Badge variant="secondary">{reservation.serviceName}</Badge>
            </div>
            {reservation.patientName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{reservation.patientName}</span>
              </div>
            )}
            {reservation.message && (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                {reservation.message}
              </p>
            )}
            {reservation.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handlers.onConfirmReservation?.(reservation)}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlers.onCancelReservation?.(reservation.id)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  },
);

ReservationPart.displayName = "ReservationPart";

export default ReservationPart;
