import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";

export function useSurveyToClient() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const convertToClient = useMutation({
    mutationFn: async (surveyId: string) => {
      if (!profile?.id) throw new Error("No profile");
      const { data, error } = await api.api["health-survey"][surveyId]["create-client"].post({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado desde encuesta");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al convertir encuesta");
      toast.error(errorMessage);
    },
  });

  const bulkConvertToClients = useMutation({
    mutationFn: async (surveyIds: string[]) => {
      if (!profile?.id) throw new Error("No profile");
      const { data, error } = await api.api["health-survey"]["bulk-create-clients"].post({
        surveyIds,
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Clientes creados desde encuestas");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error en conversión masiva");
      toast.error(errorMessage);
    },
  });

  return {
    convertToClient,
    bulkConvertToClients,
  };
}
