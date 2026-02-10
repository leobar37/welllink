import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface BookingData {
  profileId: string;
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
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
  metadata?: {
    symptoms?: string[];
    urgencyLevel?: "low" | "normal" | "high" | "urgent";
    isNewPatient?: boolean;
    insuranceProvider?: string;
    notes?: string;
  };
}

export interface BookingResponse {
  request: {
    id: string;
    status: string;
    preferredAtUtc: Date;
    requestedTimezone: string;
    expiresAt: Date;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
}

export function useBooking() {
  return useMutation({
    mutationFn: async (data: BookingData) => {
      const { data: responseData, error } =
        await api.api.reservations.request.post(data);
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
      const { data, error } =
        await api.api.public.profiles[username].services.get();
      if (error) throw error;
      return data.services as Array<{
        id: string;
        name: string;
        description?: string;
        duration: number;
        price?: string;
        category?: string;
        isActive: boolean;
      }>;
    },
    enabled: !!username,
    staleTime: 300000,
  });
}
