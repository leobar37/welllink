import { ClientList } from "@/components/clients/ClientList";
import { useTerminology } from "@/hooks/use-terminology";

export default function ClientsRoute() {
  const { terminology, isLoading } = useTerminology();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isLoading ? "Clientes" : terminology.customers}
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu cartera de {isLoading ? "clientes" : terminology.customers.toLowerCase()} y prospectos
        </p>
      </div>

      <ClientList />
    </div>
  );
}
