import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Inbox, RefreshCw, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { RequestCard } from "./request-card";
import { ApprovalDialog } from "./approval-dialog";
import { RejectionDialog } from "./rejection-dialog";
import { usePendingRequests, useReservationStats } from "@/hooks/use-reservation-requests";
import type { PendingRequest } from "@/hooks/use-reservation-requests";

export function PendingRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);

  const { data: requests, isLoading, error, refetch } = usePendingRequests();
  const { data: stats } = useReservationStats();

  const handleApprove = (requestId: string) => {
    const request = requests?.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setIsApprovalOpen(true);
    }
  };

  const handleReject = (requestId: string) => {
    const request = requests?.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setIsRejectionOpen(true);
    }
  };

  const handleEdit = (requestId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit request:", requestId);
  };

  const handleSuccess = () => {
    refetch();
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Cargando solicitudes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-destructive">Error al cargar solicitudes</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pendientes"
          value={stats?.pending || 0}
          icon={<Inbox className="h-4 w-4" />}
          color="secondary"
        />
        <StatCard
          title="Aprobadas Hoy"
          value={stats?.approved || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="default"
        />
        <StatCard
          title="Rechazadas Hoy"
          value={stats?.rejected || 0}
          icon={<XCircle className="h-4 w-4" />}
          color="destructive"
        />
        <StatCard
          title="Expiradas"
          value={stats?.expired || 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="outline"
        />
      </div>

      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Solicitudes Pendientes
              {requests && requests.length > 0 && (
                <Badge variant="secondary">{requests.length}</Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Requests List */}
      {!requests || requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>No hay solicitudes pendientes</EmptyTitle>
            <EmptyDescription>
              ¡Excelente! No tienes solicitudes de citas pendientes de revisar en este momento.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <ApprovalDialog
        request={selectedRequest}
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onSuccess={handleSuccess}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        request={selectedRequest}
        open={isRejectionOpen}
        onOpenChange={setIsRejectionOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "default" | "secondary" | "destructive" | "outline";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn("flex shrink-0 items-center justify-center rounded-lg p-3", getColorClasses(color))}>
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getColorClasses(color: StatCardProps["color"]) {
  switch (color) {
    case "default":
      return "bg-primary text-primary-foreground";
    case "secondary":
      return "bg-secondary text-secondary-foreground";
    case "destructive":
      return "bg-destructive text-destructive-foreground";
    case "outline":
      return "bg-muted text-muted-foreground";
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
