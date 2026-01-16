import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface BookingData {
  slotId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  chiefComplaint?: string;
  symptoms?: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  urgencyLevel?: "low" | "normal" | "high" | "urgent";
}

export interface BookingResponse {
  request: {
    id: string;
    status: string;
    expiresAt: string;
  };
  slot: {
    id: string;
    startTime: string;
    endTime: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price?: number;
  };
}

export interface PublicSlot {
  id: string;
  profileId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  maxReservations: number;
  currentReservations: number;
  status: string;
}

export function useBooking() {
  return useMutation({
    mutationFn: async (data: BookingData) => {
      const { data: responseData, error } = await api.api.reservations.request.post(data);
      if (error) throw error;
      return responseData as BookingResponse;
    },
    onSuccess: () => {
      toast.success("Solicitud enviada correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar solicitud");
    },
  });
}

export function usePublicServices(username: string) {
  return useQuery({
    queryKey: ["public-services", username],
    queryFn: async () => {
      const { data, error } = await api.api.public.profiles[username].services.get();
      if (error) throw error;
      return data.services as Array<{
        id: string;
        name: string;
        description?: string;
        duration: number;
        price?: number;
        category?: string;
      }>;
    },
    enabled: !!username,
    staleTime: 300000, // 5 minutes
  });
}

export function usePublicSlots(username: string, serviceId: string, date?: Date) {
  return useQuery({
    queryKey: ["public-slots", username, serviceId, date],
    queryFn: async () => {
      const { data, error } = await api.api.public.profiles[username].slots[serviceId].get({
        query: date ? { date: date.toISOString() } : undefined,
      });
      if (error) throw error;
      return {
        slots: data.slots as PublicSlot[],
        serviceId,
        date: date?.toISOString() || new Date().toISOString(),
      };
    },
    enabled: !!username && !!serviceId,
    staleTime: 60000, // 1 minute
  });
}
