import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search } from "lucide-react";
import { ClientCard } from "./ClientCard";
import { ClientForm } from "./ClientForm";
import { useClients } from "@/hooks/use-clients";
import type { Client } from "@/hooks/use-clients";

export function ClientList() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<"all" | "consumidor" | "prospecto" | "afiliado">("all");

  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesLabel = labelFilter === "all" || client.label === labelFilter;

    return matchesSearch && matchesLabel;
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      deleteClient.mutate(id);
    }
  };

  const handleSave = async (data: {
    name: string;
    phone: string;
    email?: string;
    label: "consumidor" | "prospecto" | "afiliado";
    notes?: string;
  }) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, data });
    } else {
      createClient.mutate(data);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={labelFilter} onValueChange={(value) => setLabelFilter(value as any)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etiquetas</SelectItem>
            <SelectItem value="prospecto">Prospectos</SelectItem>
            <SelectItem value="consumidor">Consumidores</SelectItem>
            <SelectItem value="afiliado">Afiliados</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      {/* Client Grid */}
      <div className="grid gap-3">
        {filteredClients && filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            {clients?.length === 0
              ? "No hay clientes agregados aún. Haz clic en \"Agregar Cliente\" para empezar."
              : "No se encontraron clientes con los filtros aplicados."}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      <ClientForm
        open={showForm}
        onOpenChange={handleCloseForm}
        client={editingClient}
        onSave={handleSave}
      />
    </div>
  );
}
