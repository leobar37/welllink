import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatPrice } from "@/components/medical-services/utils/formatters";

interface BookingSummaryProps {
  service: {
    name: string;
    duration: number;
    price?: number;
  };
  slot: {
    startTime: string;
    endTime: string;
  };
  patientData: {
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    urgencyLevel?: string;
  };
}

export function BookingSummary({ service, slot, patientData }: BookingSummaryProps) {
  const appointmentDate = new Date(slot.startTime);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Servicio
          </h3>
          <p className="text-lg font-semibold">{service.name}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary">{formatDuration(service.duration)}</Badge>
            {service.price && (
              <Badge variant="outline">{formatPrice(service.price)}</Badge>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Fecha y hora
          </h3>
          <p className="text-lg font-semibold">
            {format(appointmentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(appointmentDate, "HH:mm")} -{" "}
            {format(new Date(slot.endTime), "HH:mm")}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Tus datos
          </h3>
          <p className="font-medium">{patientData.patientName}</p>
          <p className="text-sm text-muted-foreground">{patientData.patientPhone}</p>
          {patientData.patientEmail && (
            <p className="text-sm text-muted-foreground">{patientData.patientEmail}</p>
          )}
          {patientData.urgencyLevel && patientData.urgencyLevel !== "normal" && (
            <Badge
              variant={
                patientData.urgencyLevel === "urgent" ||
                patientData.urgencyLevel === "high"
                  ? "destructive"
                  : "secondary"
              }
              className="mt-2"
            >
              Urgencia: {patientData.urgencyLevel}
            </Badge>
          )}
        </div>

        <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
          <p className="text-sm text-primary">
            ✓ Tu solicitud será enviada y recibirás confirmación por WhatsApp
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
