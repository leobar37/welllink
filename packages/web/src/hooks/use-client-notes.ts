import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

export interface ClientNote {
  id: string;
  clientId: string;
  profileId: string;
  note: string;
  createdAt: string;
}

export function useClientNotes(clientId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: notes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client-notes", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await api.api.clients[clientId].notes.get();
      if (error) throw error;
      return (data as ClientNote[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!clientId,
  });

  const addNote = useMutation({
    mutationFn: async (note: string) => {
      if (!clientId) throw new Error("No client ID");
      const { data, error } = await api.api.clients[clientId].notes.post({ note });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      toast.success("Nota agregada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al agregar nota");
      toast.error(errorMessage);
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ noteId, note }: { noteId: string; note: string }) => {
      const { data, error } = await api.api.clients[clientId].notes[noteId].put({ note });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      toast.success("Nota actualizada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar nota");
      toast.error(errorMessage);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await api.api.clients[clientId].notes[noteId].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      toast.success("Nota eliminada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar nota");
      toast.error(errorMessage);
    },
  });

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
  };
}
