import { PendingRequests } from "@/components/doctor/pending-requests";

export default function ReservationsRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de citas de tus pacientes
        </p>
      </div>

      <PendingRequests />
    </div>
  );
}
