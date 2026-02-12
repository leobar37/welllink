import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Inbox,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { RequestCard } from "./request-card";
import { ApprovalDialog } from "./approval-dialog";
import { RejectionDialog } from "./rejection-dialog";
import {
  usePendingRequests,
  useReservationStats,
} from "@/hooks/use-reservation-requests";
import type { PendingRequest } from "@/hooks/use-reservation-requests";
import { cn } from "@/lib/utils";

export function PendingRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(
    null,
  );
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            Solicitudes Pendientes
            {requests && requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisa y gestiona las solicitudes de tus pacientes
          </p>
        </div>
      </div>

      {/* Requests List */}
      {!requests || requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>No hay solicitudes pendientes</EmptyTitle>
            <EmptyDescription>
              ¡Excelente! No tienes solicitudes de citas pendientes de revisar
              en este momento.
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
    <div className="bg-muted/40 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          getColorClasses(color),
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0 space-y-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
          {title}
        </p>
        <p className="text-2xl font-semibold leading-none tabular-nums sm:text-3xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function getColorClasses(color: StatCardProps["color"]) {
  switch (color) {
    case "default":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "secondary":
      return "bg-primary/10 text-primary dark:text-primary-foreground";
    case "destructive":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "outline":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
}
