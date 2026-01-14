import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

export interface MedicalService {
  id: string;
  profileId: string;
  imageAssetId?: string | null;
  name: string;
  description?: string | null;
  duration: number;
  price?: string | null;
  category?: string | null;
  requirements?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewMedicalService {
  profileId: string;
  name: string;
  description?: string;
  duration: number;
  price?: string;
  category?: string;
  requirements?: string;
  isActive?: boolean;
  imageAssetId?: string;
}

export interface UpdateMedicalService {
  name?: string;
  description?: string;
  duration?: number;
  price?: string;
  category?: string;
  requirements?: string;
  isActive?: boolean;
  imageAssetId?: string;
}

export function useMedicalServices(profileId: string) {
  const queryClient = useQueryClient();

  const {
    data: services,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["medical-services", profileId],
    queryFn: async () => {
      const { data, error } = await api.api["medical-services"].get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as MedicalService[];
    },
    enabled: !!profileId,
  });

  const createService = useMutation({
    mutationFn: async (data: NewMedicalService) => {
      const { data: resData, error } =
        await api.api["medical-services"].post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medical-services", profileId],
      });
      toast.success("Servicio médico creado exitosamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear servicio");
      toast.error(errorMessage);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicalService;
    }) => {
      const { data: resData, error } =
        await api.api["medical-services"][id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medical-services", profileId],
      });
      toast.success("Servicio médico actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al actualizar servicio",
      );
      toast.error(errorMessage);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api["medical-services"][id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medical-services", profileId],
      });
      toast.success("Servicio médico eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al eliminar servicio",
      );
      toast.error(errorMessage);
    },
  });

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
  };
}
