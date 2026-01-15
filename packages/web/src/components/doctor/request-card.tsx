import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Phone, Mail, AlertTriangle, FileText, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PendingRequest } from "@/hooks/use-reservation-requests";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: PendingRequest;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onEdit?: (requestId: string) => void;
}

export function RequestCard({ request, onApprove, onReject, onEdit }: RequestCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "urgent":
        return "destructive";
      case "high":
        return "outline";
      case "normal":
        return "secondary";
      case "low":
        return "default";
      default:
        return "secondary";
    }
  };

  const timeUntilExpiry = new Date(request.expiresAt).getTime() - Date.now();
  const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
  const isExpiringSoon = minutesUntilExpiry < 10;

  const appointmentDate = new Date(request.slot.startTime);
  const appointmentTime = format(appointmentDate, "p", { locale: es });

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{request.patientName}</h3>
            <Badge variant={getUrgencyColor(request.urgencyLevel || "normal")}>
              {request.urgencyLevel === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {request.urgencyLevel || "normal"}
            </Badge>
            {isExpiringSoon && (
              <Badge variant="destructive">
                <Clock className="h-3 w-3 mr-1" />
                {minutesUntilExpiry} min
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {request.patientPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {request.patientPhone}
              </span>
            )}
            {request.patientEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {request.patientEmail}
              </span>
            )}
            {request.patientAge && (
              <span>{request.patientAge} años</span>
            )}
          </div>

          {request.chiefComplaint && (
            <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Motivo de consulta:</p>
              <p className="text-sm text-foreground">{request.chiefComplaint}</p>
            </div>
          )}

          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Cita:</p>
            <p className="font-medium">{appointmentTime}</p>
            {request.service && (
              <p className="text-muted-foreground">{request.service.name}</p>
            )}
          </div>

          {showDetails && (
            <div className="space-y-2 bg-muted/50 p-3 rounded-md">
              {request.symptoms && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Síntomas:</p>
                  <p className="text-xs text-foreground">{request.symptoms}</p>
                </div>
              )}
              {request.medicalHistory && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Historia médica:</p>
                  <p className="text-xs text-foreground">{request.medicalHistory}</p>
                </div>
              )}
              {request.currentMedications && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Medicamentos actuales:</p>
                  <p className="text-xs text-foreground">{request.currentMedications}</p>
                </div>
              )}
              {request.allergies && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Alergias:</p>
                  <p className="text-xs text-foreground">{request.allergies}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="min-w-[100px]"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-1" />
                Ver más
              </>
            )}
          </Button>

          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(request.id)}
              className="min-w-[100px]"
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t gap-3">
        <div className="text-sm text-muted-foreground">
          Solicitado: {format(new Date(request.createdAt), "PPp", { locale: es })}
        </div>

        <div className="flex gap-2">
          {onReject && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(request.id)}
            >
              Rechazar
            </Button>
          )}
          {onApprove && (
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              className={cn(
                "min-w-[100px]",
                isExpiringSoon && "animate-pulse"
              )}
            >
              Aprobar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
