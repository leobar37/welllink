import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";
import type { PaymentMethod } from "@/lib/types";

export function usePaymentMethods() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  // Query for payment methods
  const {
    data: methods,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payment-methods", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api["payment-methods"].get({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return (data as unknown as PaymentMethod[]).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
    },
    enabled: !!profile?.id,
  });

  // Create mutation
  const createMethod = useMutation({
    mutationFn: async (
      newMethod: Omit<
        PaymentMethod,
        | "id"
        | "profileId"
        | "isActive"
        | "displayOrder"
        | "createdAt"
        | "updatedAt"
        | "metadata"
      >,
    ) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } = await api.api["payment-methods"].post({
        profileId: profile.id,
        ...newMethod,
        instructions: newMethod.instructions || undefined,
        details: newMethod.details || undefined,
        displayOrder: methods ? methods.length : 0,
        isActive: false, // Por defecto inactivo
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Método de pago agregado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to add payment method",
      );
      toast.error(errorMessage);
    },
  });

  // Update mutation
  const updateMethod = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<PaymentMethod, "id" | "createdAt">>;
    }) => {
      const { data: resData, error } = await api.api["payment-methods"][
        id
      ].put({
        ...data,
        instructions: data.instructions || undefined,
        details: data.details || undefined,
        metadata: data.metadata || undefined,
      });
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Método de pago actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to update payment method",
      );
      toast.error(errorMessage);
    },
  });

  // Toggle mutation
  const toggleMethod = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Pick<PaymentMethod, "isActive">;
    }) => {
      const { data: resData, error } = await api.api["payment-methods"][
        id
      ].toggle.post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to toggle payment method",
      );
      toast.error(errorMessage);
    },
  });

  // Activate multiple methods mutation
  const activateMethods = useMutation({
    mutationFn: async (methodIds: string[]) => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await api.api["payment-methods"].activate.post({
        profileId: profile.id,
        methodIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Métodos de pago activados");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to activate payment methods",
      );
      toast.error(errorMessage);
    },
  });

  // Delete mutation
  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api["payment-methods"][id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Método de pago eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to delete payment method",
      );
      toast.error(errorMessage);
    },
  });

  // Reorder mutation
  const reorderMethods = useMutation({
    mutationFn: async (methodIds: string[]) => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await api.api["payment-methods"].reorder.post({
        profileId: profile.id,
        methodIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to reorder payment methods",
      );
      toast.error(errorMessage);
    },
  });

  // Seed defaults mutation
  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No profile");
      const { data, error } = await api.api["payment-methods"]["seed-defaults"][
        profile.id
      ].post({});
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Métodos de pago por defecto restaurados");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to seed payment methods",
      );
      toast.error(errorMessage);
    },
  });

  return {
    methods,
    isLoading,
    error,
    createMethod,
    updateMethod,
    toggleMethod,
    activateMethods,
    deleteMethod,
    reorderMethods,
    seedDefaults,
  };
}
