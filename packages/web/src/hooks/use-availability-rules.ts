import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface AvailabilityRule {
  id: string;
  profileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  maxAppointmentsPerSlot: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityRuleData {
  profileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime?: number;
  maxAppointmentsPerSlot?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateAvailabilityRuleData {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  bufferTime?: number;
  maxAppointmentsPerSlot?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface PreviewSlotsData {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export interface PreviewSlotResult {
  date: Date;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  count: number;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || "";
}

export function useAvailabilityRules(profileId: string) {
  return useQuery({
    queryKey: ["availability-rules", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.availability[profileId].get();
      if (error) throw error;
      return data as AvailabilityRule[];
    },
    enabled: !!profileId,
    staleTime: 60000, // 1 minute
  });
}

export function useCreateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvailabilityRuleData) => {
      const { data: responseData, error } =
        await api.api.availability.post(data);
      if (error) throw error;
      return responseData;
    },
    onSuccess: () => {
      toast.success("Regla de disponibilidad creada");
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear regla");
    },
  });
}

export function useUpdateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ruleId,
      data,
    }: {
      ruleId: string;
      data: UpdateAvailabilityRuleData;
    }) => {
      const { data: responseData, error } =
        await api.api.availability[ruleId].put(data);
      if (error) throw error;
      return responseData;
    },
    onSuccess: () => {
      toast.success("Regla de disponibilidad actualizada");
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar regla");
    },
  });
}

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { data, error } = await api.api.availability[ruleId].delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Regla de disponibilidad eliminada");
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar regla");
    },
  });
}

export function usePreviewSlots() {
  return useQuery({
    queryKey: ["availability-preview"],
    queryFn: async () => {
      const { data, error } = await api.api.availability.preview[
        "profile-id"
      ].get({
        query: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      if (error) throw error;
      return data as PreviewSlotResult[];
    },
    enabled: false, // Only run when explicitly called
    staleTime: 30000,
  });
}

export function usePreviewSlotsMutation() {
  return useMutation({
    mutationFn: async ({
      profileId,
      startDate,
      endDate,
    }: PreviewSlotsData & { profileId: string }) => {
      const { data, error } = await api.api.availability.preview[profileId].get(
        {
          query: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
      );
      if (error) throw error;
      return data as PreviewSlotResult[];
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al previsualizar slots");
    },
  });
}

export interface GenerateSlotsData {
  profileId: string;
  serviceId: string;
  mode: "nextWeek" | "range";
  startDate?: Date;
  endDate?: Date;
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateSlotsData) => {
      const { profileId, serviceId, mode, startDate, endDate } = data;

      let requestStartDate: Date;
      let requestEndDate: Date;

      if (mode === "nextWeek") {
        requestStartDate = new Date();
        requestStartDate.setDate(requestStartDate.getDate() + 7);
        requestStartDate.setHours(0, 0, 0, 0);

        requestEndDate = new Date(requestStartDate);
        requestEndDate.setDate(requestEndDate.getDate() + 6);
        requestEndDate.setHours(23, 59, 59, 999);
      } else {
        if (!startDate || !endDate) {
          throw new Error("startDate and endDate are required for range mode");
        }
        requestStartDate = startDate;
        requestEndDate = endDate;
      }

      const { data: responseData, error } =
        await api.api.availability.generate.post({
          profileId,
          serviceId,
          startDate: requestStartDate.toISOString(),
          endDate: requestEndDate.toISOString(),
        });

      if (error) throw error;
      return responseData;
    },
    onSuccess: (data: any) => {
      const { generated } = data;
      toast.success(`${generated} slots generados exitosamente`);
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al generar slots");
    },
  });
}
