import { ClientList } from "@/components/clients/ClientList";

export default function ClientsRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona tu cartera de clientes y prospectos
        </p>
      </div>

      <ClientList />
    </div>
  );
}
