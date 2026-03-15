import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types for Service Packages
export interface ServicePackage {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  price: string;
  totalSessions: number;
  discountPercent: number | null;
  services: string[] | null;
  validityDays: number | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  price: string;
  billingPeriod: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  benefits: string[] | null;
  includedSessions: number | null;
  discountPercent: number | null;
  unlimitedSessions: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPackage {
  id: string;
  profileId: string;
  clientId: string;
  purchaseType: "package" | "membership";
  packageId: string | null;
  membershipId: string | null;
  remainingSessions: number;
  totalSessions: number;
  pricePaid: string | null;
  status: "active" | "expired" | "exhausted" | "cancelled";
  purchasedAt: string;
  expiresAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Create Package Data
export interface CreatePackageData {
  profileId: string;
  name: string;
  description?: string;
  price: string;
  totalSessions: number;
  discountPercent?: number;
  services?: string[];
  validityDays?: number;
}

// Update Package Data
export interface UpdatePackageData {
  name?: string;
  description?: string;
  price?: string;
  totalSessions?: number;
  discountPercent?: number;
  services?: string[];
  validityDays?: number;
  isActive?: boolean;
}

// Create Membership Data
export interface CreateMembershipData {
  profileId: string;
  name: string;
  description?: string;
  price: string;
  billingPeriod: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  benefits?: string[];
  includedSessions?: number;
  discountPercent?: number;
  unlimitedSessions?: boolean;
}

// Update Membership Data
export interface UpdateMembershipData {
  name?: string;
  description?: string;
  price?: string;
  billingPeriod?: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  benefits?: string[];
  includedSessions?: number;
  discountPercent?: number;
  unlimitedSessions?: boolean;
  isActive?: boolean;
}

// Purchase Package Data
export interface PurchasePackageData {
  profileId: string;
  clientId: string;
  packageId: string;
  pricePaid: string;
}

// Subscribe to Membership Data
export interface SubscribeMembershipData {
  profileId: string;
  clientId: string;
  membershipId: string;
  pricePaid: string;
  autoRenew?: boolean;
}

// Hooks for Service Packages
export function usePackages(profileId: string) {
  return useQuery({
    queryKey: ["packages", profileId],
    queryFn: async () => {
      const response = await api.api.packages.get({ query: { profileId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar los paquetes");
      }
      return response.data as ServicePackage[];
    },
    enabled: !!profileId,
  });
}

export function usePackage(packageId: string) {
  return useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      const response = await api.api.packages[":id"].get({ params: { id: packageId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar el paquete");
      }
      return response.data as ServicePackage;
    },
    enabled: !!packageId,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePackageData) => {
      const response = await api.api.packages.post(data);
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al crear el paquete");
      }
      return response.data as ServicePackage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packages", variables.profileId] });
      toast.success("Paquete creado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el paquete");
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePackageData }) => {
      const response = await api.api.packages[":id"].put({ params: { id }, body: data });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al actualizar el paquete");
      }
      return response.data as ServicePackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Paquete actualizado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el paquete");
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const response = await api.api.packages[":id"].delete({ params: { id } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al eliminar el paquete");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packages", variables.profileId] });
      toast.success("Paquete eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el paquete");
    },
  });
}

// Hooks for Memberships
export function useMemberships(profileId: string) {
  return useQuery({
    queryKey: ["memberships", profileId],
    queryFn: async () => {
      const response = await api.api.packages.memberships.get({ query: { profileId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar las membresías");
      }
      return response.data as Membership[];
    },
    enabled: !!profileId,
  });
}

export function useMembership(membershipId: string) {
  return useQuery({
    queryKey: ["membership", membershipId],
    queryFn: async () => {
      const response = await api.api.packages.memberships[":id"].get({ params: { id: membershipId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar la membresía");
      }
      return response.data as Membership;
    },
    enabled: !!membershipId,
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMembershipData) => {
      const response = await api.api.packages.memberships.post(data);
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al crear la membresía");
      }
      return response.data as Membership;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["memberships", variables.profileId] });
      toast.success("Membresía creada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear la membresía");
    },
  });
}

export function useUpdateMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMembershipData }) => {
      const response = await api.api.packages.memberships[":id"].put({ params: { id }, body: data });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al actualizar la membresía");
      }
      return response.data as Membership;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Membresía actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar la membresía");
    },
  });
}

export function useDeleteMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const response = await api.api.packages.memberships[":id"].delete({ params: { id } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al eliminar la membresía");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["memberships", variables.profileId] });
      toast.success("Membresía eliminada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar la membresía");
    },
  });
}

// Hooks for Client Packages (Purchased Packages)
export function useClientPackages(profileId: string) {
  return useQuery({
    queryKey: ["client-packages", profileId],
    queryFn: async () => {
      const response = await api.api.packages["client-packages"].get({ query: { profileId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar los paquetes del cliente");
      }
      return response.data as ClientPackage[];
    },
    enabled: !!profileId,
  });
}

export function useClientPackagesByClient(clientId: string) {
  return useQuery({
    queryKey: ["client-packages-by-client", clientId],
    queryFn: async () => {
      const response = await api.api.packages["client-packages"].get({ query: { clientId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar los paquetes del cliente");
      }
      return response.data as ClientPackage[];
    },
    enabled: !!clientId,
  });
}

export function useClientPackage(clientPackageId: string) {
  return useQuery({
    queryKey: ["client-package", clientPackageId],
    queryFn: async () => {
      const response = await api.api.packages["client-packages"][":id"].get({ params: { id: clientPackageId } });
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cargar el paquete del cliente");
      }
      return response.data as ClientPackage;
    },
    enabled: !!clientPackageId,
  });
}

export function usePurchasePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchasePackageData) => {
      const response = await api.api.packages["client-packages"].purchase.post(data);
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al comprar el paquete");
      }
      return response.data as ClientPackage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["client-packages-by-client", variables.clientId] });
      toast.success("Paquete comprado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al comprar el paquete");
    },
  });
}

export function useSubscribeMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubscribeMembershipData) => {
      const response = await api.api.packages["client-packages"].subscribe.post(data);
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al suscribirse a la membresía");
      }
      return response.data as ClientPackage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["client-packages-by-client", variables.clientId] });
      toast.success("Membresía adquirida correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al adquirir la membresía");
    },
  });
}

export function useRedeemSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientPackageId: string) => {
      const response = await api.api.packages["client-packages"][":id"].redeem.post(
        { params: { id: clientPackageId } },
        {}
      );
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al canjear la sesión");
      }
      return response.data as ClientPackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-packages"] });
      queryClient.invalidateQueries({ queryKey: ["client-package"] });
      toast.success("Sesión canjeada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al canjear la sesión");
    },
  });
}

export function useCancelClientPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientPackageId: string) => {
      const response = await api.api.packages["client-packages"][":id"].cancel.post(
        { params: { id: clientPackageId } },
        {}
      );
      if (response.error) {
        throw new Error(response.error.value?.message || "Error al cancelar el paquete");
      }
      return response.data as ClientPackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-packages"] });
      queryClient.invalidateQueries({ queryKey: ["client-package"] });
      toast.success("Paquete cancelado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al cancelar el paquete");
    },
  });
}
