import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  usePendingRequests,
  useApproveRequest,
  useRejectRequest,
} from "@/hooks/use-reservation-requests";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/use-profile";

const urgencyColors = {
  low: "bg-blue-100 text-blue-800",
  normal: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
} as const;

const urgencyLabels = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
} as const;

export function PendingRequestsPage() {
  const { profile } = useProfile();
  const { data: pendingRequests, isLoading } = usePendingRequests(profile?.id);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleApprove = (requestId: string) => {
    approveRequest.mutate({
      requestId,
      approvedBy: profile?.id || "",
      notes: notes || undefined,
    });
    setSelectedRequest(null);
    setNotes("");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    rejectRequest.mutate({
      requestId: selectedRequest!,
      rejectedBy: profile?.id || "",
      rejectionReason,
    });
    setSelectedRequest(null);
    setRejectionReason("");
  };

  const getUrgencyColor = (level?: string) => {
    if (!level) return urgencyColors.normal;
    return (
      urgencyColors[level as keyof typeof urgencyColors] || urgencyColors.normal
    );
  };

  const getUrgencyLabel = (level?: string) => {
    if (!level) return urgencyLabels.normal;
    return (
      urgencyLabels[level as keyof typeof urgencyLabels] || urgencyLabels.normal
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Solicitudes Pendientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona y responde a las solicitudes de cita de tus pacientes
          </p>
        </div>
        {pendingRequests && pendingRequests.length > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingRequests.length}
          </Badge>
        )}
      </div>

      {pendingRequests && pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-xl">
              No hay solicitudes pendientes
            </CardTitle>
            <CardDescription className="text-center mt-2">
              Las solicitudes de cita aparecerán aquí cuando los pacientes las
              realicen
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests?.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">
                        {request.patientName}
                      </CardTitle>
                      <Badge className={getUrgencyColor(request.urgencyLevel)}>
                        {getUrgencyLabel(request.urgencyLevel)}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{request.patientPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.slot.startTime).toLocaleDateString(
                            "es-ES",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(request.slot.startTime).toLocaleTimeString(
                            "es-ES",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <User className="h-4 w-4 mt-0.5" />
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Servicio:</span>{" "}
                            {request.service.name}
                          </div>
                          {request.chiefComplaint && (
                            <div>
                              <span className="font-medium">Motivo:</span>{" "}
                              {request.chiefComplaint}
                            </div>
                          )}
                          {request.symptoms && (
                            <div>
                              <span className="font-medium">Síntomas:</span>{" "}
                              {request.symptoms}
                            </div>
                          )}
                          {request.medicalHistory && (
                            <div>
                              <span className="font-medium">Antecedentes:</span>{" "}
                              {request.medicalHistory}
                            </div>
                          )}
                          {request.allergies && (
                            <div>
                              <span className="font-medium">Alergias:</span>{" "}
                              {request.allergies}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Expira en{" "}
                      {Math.ceil(
                        (new Date(request.expiresAt).getTime() - Date.now()) /
                          (1000 * 60),
                      )}{" "}
                      min
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${request.id}`}>
                      Notas al aprobar
                    </Label>
                    <Textarea
                      id={`notes-${request.id}`}
                      placeholder="Añade notas o instrucciones para esta cita..."
                      value={selectedRequest === request.id ? notes : ""}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedRequest(request.id)}
                      disabled={selectedRequest === request.id}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={approveRequest.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {approveRequest.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Aprobar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={selectedRequest !== null}
        onOpenChange={setSelectedRequest}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Rechazar Solicitud
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres rechazar esta solicitud de cita? Esta
              acción liberará el horario para otros pacientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Especifica el motivo por el que se rechaza esta solicitud..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRequest(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectRequest.isPending || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Rechazar Solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
