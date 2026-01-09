import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";

export interface Client {
  id: string;
  profileId: string;
  name: string;
  phone: string;
  email?: string;
  label: "consumidor" | "prospecto" | "afiliado";
  notes?: string;
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useClients() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.clients.get();
      if (error) throw error;
      return (data as Client[]).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!profile?.id,
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, "id" | "createdAt" | "updatedAt" | "profileId">) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } = await api.clients.post({
        ...client,
        profileId: profile.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear cliente");
      toast.error(errorMessage);
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { data: resData, error } = await api.clients[id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar cliente");
      toast.error(errorMessage);
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.clients[id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar cliente");
      toast.error(errorMessage);
    },
  });

  const getClientsByLabel = (label: Client["label"]) => {
    return useQuery({
      queryKey: ["clients", profile?.id, "label", label],
      queryFn: async () => {
        const { data, error } = await api.clients.label[label].get();
        if (error) throw error;
        return data as Client[];
      },
      enabled: !!profile?.id && !!label,
    });
  };

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientsByLabel,
  };
}
