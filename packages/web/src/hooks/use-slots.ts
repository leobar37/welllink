import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface TimeSlot {
  id: string;
  profileId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  maxReservations: number;
  currentReservations: number;
  status: "available" | "pending_approval" | "reserved" | "expired" | "blocked" | "cancelled";
  createdAt: string;
  expiresAt?: string;
}

export interface CreateSlotData {
  profileId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  maxReservations?: number;
}

export interface CreateBatchSlotsData {
  profileId: string;
  serviceId: string;
  slots: Array<{
    startTime: string;
    endTime: string;
    maxReservations?: number;
  }>;
}

export interface GetSlotsData {
  profileId: string;
  serviceId?: string;
  status?: "available" | "pending_approval" | "reserved" | "expired" | "blocked" | "cancelled";
  startDate?: Date;
  endDate?: Date;
}

export function useSlots(data: GetSlotsData) {
  const { profileId, serviceId, status, startDate, endDate } = data;

  return useQuery({
    queryKey: ["slots", profileId, serviceId, status, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await api.api.slots[profileId].get({
        query: {
          serviceId,
          status,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });
      if (error) throw error;
      return data as TimeSlot[];
    },
    enabled: !!profileId,
    staleTime: 30000, // 30 seconds
  });
}

export function useAvailableSlots(profileId: string, serviceId: string, date: Date) {
  return useQuery({
    queryKey: ["available-slots", profileId, serviceId, date],
    queryFn: async () => {
      const { data, error } = await api.api.slots[profileId].available[serviceId].get({
        query: {
          date: date.toISOString(),
        },
      });
      if (error) throw error;
      return data as TimeSlot[];
    },
    enabled: !!profileId && !!serviceId,
    staleTime: 30000,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSlotData) => {
      const { result, error } = await api.api.slots.post(data);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Slot creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear slot");
    },
  });
}

export function useCreateBatchSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBatchSlotsData) => {
      const { result, error } = await api.api.slots.batch.post(data);
      if (error) throw error;
      return result;
    },
    onSuccess: (data: any) => {
      const { created, failed } = data;
      if (failed > 0) {
        toast.warning(`${created} slots creados, ${failed} fallaron`);
      } else {
        toast.success(`${created} slots creados exitosamente`);
      }
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear slots");
    },
  });
}

export function useUpdateSlotStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, status }: { slotId: string; status: string }) => {
      const { data, error } = await api.api.slots[slotId].status.put({ status });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Estado del slot actualizado");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar estado");
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { data, error } = await api.api.slots[slotId].delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Slot eliminado");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar slot");
    },
  });
}

export function useBlockSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { data, error } = await api.api.slots[slotId].block.post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Slot bloqueado");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al bloquear slot");
    },
  });
}

export function useUnblockSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { data, error } = await api.api.slots[slotId].unblock.post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Slot desbloqueado");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al desbloquear slot");
    },
  });
}
