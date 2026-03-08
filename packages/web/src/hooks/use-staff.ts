import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types for Staff
export interface Staff {
  id: string;
  profileId: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: "admin" | "manager" | "staff";
  avatarId: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffWithRelations extends Staff {
  services: StaffService[];
  availabilities: StaffAvailability[];
}

export interface StaffService {
  id: string;
  staffId: string;
  serviceId: string;
  profileId: string;
  isActive: boolean;
  createdAt: string;
  service?: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    duration: number;
  };
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number; // 1=Monday, 7=Sunday
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  breaks: Array<{
    start: string;
    end: string;
  }>;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  profileId?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: "admin" | "manager" | "staff";
  avatarId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateStaffData {
  profileId?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: "admin" | "manager" | "staff";
  avatarId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SetAvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breaks?: Array<{ start: string; end: string }>;
  isAvailable?: boolean;
}

// Hooks
export function useStaff(profileId: string) {
  return useQuery({
    queryKey: ["staff", profileId],
    queryFn: async () => {
      const response = await api.api.staff.get({ query: { profileId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar el personal");
      }
      return response.data as Staff[];
    },
    enabled: !!profileId,
  });
}

export function useStaffWithRelations(profileId: string) {
  return useQuery({
    queryKey: ["staff-with-relations", profileId],
    queryFn: async () => {
      const response = await api.api.staff["with-relations"].get({ query: { profileId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar el personal");
      }
      return response.data as StaffWithRelations[];
    },
    enabled: !!profileId,
  });
}

export function useStaffMember(staffId: string, profileId: string) {
  return useQuery({
    queryKey: ["staff", staffId, profileId],
    queryFn: async () => {
      const response = await api.api.staff[":id"].get({ 
        params: { id: staffId },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar el miembro del personal");
      }
      return response.data as StaffWithRelations;
    },
    enabled: !!staffId && !!profileId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffData) => {
      const response = await api.api.staff.post(data);
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al crear el miembro del personal");
      }
      return response.data as Staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Miembro del personal creado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el miembro del personal");
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStaffData }) => {
      const response = await api.api.staff[":id"].put({ 
        params: { id },
        body: data
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al actualizar el miembro del personal");
      }
      return response.data as Staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Miembro del personal actualizado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el miembro del personal");
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const response = await api.api.staff[":id"].delete({ 
        params: { id },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al eliminar el miembro del personal");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Miembro del personal eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el miembro del personal");
    },
  });
}

// Staff Services
export function useStaffServices(staffId: string, profileId: string) {
  return useQuery({
    queryKey: ["staff-services", staffId, profileId],
    queryFn: async () => {
      const response = await api.api.staff[":staffId"].services.get({ 
        params: { staffId },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar los servicios");
      }
      return response.data as StaffService[];
    },
    enabled: !!staffId && !!profileId,
  });
}

export function useAssignStaffService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, serviceId, profileId }: { 
      staffId: string; 
      serviceId: string; 
      profileId?: string 
    }) => {
      const response = await api.api.staff[":staffId"].services.post({
        params: { staffId },
        body: { serviceId, profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al asignar el servicio");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-services"] });
      toast.success("Servicio asignado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al asignar el servicio");
    },
  });
}

export function useRemoveStaffService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, serviceId, profileId }: { 
      staffId: string; 
      serviceId: string; 
      profileId?: string 
    }) => {
      const response = await api.api.staff[":staffId"].services[":serviceId"].delete({ 
        params: { staffId, serviceId },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al eliminar el servicio");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-services"] });
      toast.success("Servicio eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el servicio");
    },
  });
}

export function useReplaceStaffServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, serviceIds, profileId }: { 
      staffId: string; 
      serviceIds: string[]; 
      profileId?: string 
    }) => {
      const response = await api.api.staff[":staffId"].services.put({
        params: { staffId },
        body: { serviceIds, profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al actualizar los servicios");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-services"] });
      toast.success("Servicios actualizados correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar los servicios");
    },
  });
}

// Staff Availability
export function useStaffAvailability(staffId: string, profileId: string) {
  return useQuery({
    queryKey: ["staff-availability", staffId, profileId],
    queryFn: async () => {
      const response = await api.api.staff[":staffId"].availability.get({ 
        params: { staffId },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar la disponibilidad");
      }
      return response.data as StaffAvailability[];
    },
    enabled: !!staffId && !!profileId,
  });
}

export function useSetStaffAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, availability, profileId }: { 
      staffId: string; 
      availability: SetAvailabilityData;
      profileId?: string;
    }) => {
      const response = await api.api.staff[":staffId"].availability.post({
        params: { staffId },
        body: { ...availability, profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al establecer la disponibilidad");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-availability"] });
      toast.success("Disponibilidad actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al establecer la disponibilidad");
    },
  });
}

export function useSetStaffAvailabilities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, availabilities, profileId }: { 
      staffId: string; 
      availabilities: SetAvailabilityData[];
      profileId?: string;
    }) => {
      const response = await api.api.staff[":staffId"].availability.put({
        params: { staffId },
        body: { availabilities, profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al establecer la disponibilidad");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-availability"] });
      toast.success("Disponibilidad actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al establecer la disponibilidad");
    },
  });
}

export function useDeleteStaffAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, availabilityId, profileId }: { 
      staffId: string; 
      availabilityId: string;
      profileId?: string;
    }) => {
      const response = await api.api.staff[":staffId"].availability[":availabilityId"].delete({ 
        params: { staffId, availabilityId },
        query: { profileId }
      });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al eliminar la disponibilidad");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-availability"] });
      toast.success("Disponibilidad eliminada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar la disponibilidad");
    },
  });
}
