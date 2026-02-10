import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface MedicalService {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  category: string;
}

export interface ReservationRequest {
  id: string;
  profileId: string;
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
  status: "pending" | "approved" | "rejected" | "expired" | "counter_proposed";
  preferredAtUtc: string;
  requestedTimezone: string;
  metadata?: {
    symptoms?: string[];
    urgencyLevel?: "low" | "normal" | "high" | "urgent";
    isNewPatient?: boolean;
    insuranceProvider?: string;
    notes?: string;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type PendingRequest = ReservationRequest & {
  service: MedicalService;
};

export function usePendingRequests(profileId?: string) {
  return useQuery({
    queryKey: ["pending-requests", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const result = await api.api.reservations[":profileId"].pending.get();
      return result as PendingRequest[];
    },
    enabled: !!profileId,
    staleTime: 30000, // 30 seconds
  });
}

export function useReservationStats(profileId?: string) {
  return useQuery({
    queryKey: ["reservation-stats", profileId],
    queryFn: async () => {
      if (!profileId)
        return { pending: 0, approved: 0, rejected: 0, expired: 0 };
      const result = await api.api.reservations[":profileId"].stats.get();
      return result as {
        pending: number;
        approved: number;
        rejected: number;
        expired: number;
      };
    },
    enabled: !!profileId,
    staleTime: 60000, // 1 minute
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      approvedBy: string;
      scheduledDate: string;
      scheduledTime: string;
      timezone: string;
      notes?: string;
    }) => {
      const result = await api.api.reservations.approve.post(data);
      return result;
    },
    onSuccess: () => {
      toast.success("Solicitud aprobada correctamente");
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al aprobar solicitud");
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      rejectedBy: string;
      rejectionReason: string;
    }) => {
      const result = await api.api.reservations.reject.post(data);
      return result;
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada correctamente");
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al rechazar solicitud");
    },
  });
}

export function useProposeReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      proposedBy: string;
      newDate: string;
      newTime: string;
      timezone: string;
      reason?: string;
    }) => {
      const result = await api.api.reservations.reschedule.propose.post(data);
      return result;
    },
    onSuccess: () => {
      toast.success("Propuesta de reprogramación enviada");
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al proponer reprogramación");
    },
  });
}
