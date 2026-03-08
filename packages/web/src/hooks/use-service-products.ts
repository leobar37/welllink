import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// Service-Product association types
export interface ServiceProduct {
  id: string;
  profileId: string;
  serviceId: string;
  productId: string;
  quantityRequired: number;
  isRequired: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProductWithProduct extends ServiceProduct {
  product: {
    id: string;
    name: string;
    sku: string;
    price: string;
    unit: string;
  };
}

/**
 * Hook to fetch products associated with a service
 */
export function useMedicalServiceProducts(profileId: string, serviceId: string | undefined) {
  const {
    data: serviceProducts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["medical-service-products", profileId, serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await api.api.services[serviceId].products.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as ServiceProductWithProduct[];
    },
    enabled: !!profileId && !!serviceId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    serviceProducts,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to add a product to a service
 */
export function useAddMedicalServiceProduct(profileId: string) {
  const queryClient = useQueryClient();

  const addProduct = useMutation({
    mutationFn: async ({ serviceId, productId, quantityRequired, isRequired, notes }: {
      serviceId: string;
      productId: string;
      quantityRequired?: number;
      isRequired?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await api.api.services[serviceId].products.post({
        productId,
        quantityRequired,
        isRequired,
        notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medical-service-products", profileId, variables.serviceId] });
      toast.success("Producto agregado al servicio");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al agregar producto");
      toast.error(errorMessage);
    },
  });

  return addProduct;
}

/**
 * Hook to remove a product from a service
 */
export function useRemoveMedicalServiceProduct(profileId: string) {
  const queryClient = useQueryClient();

  const removeProduct = useMutation({
    mutationFn: async ({ serviceId, associationId }: { serviceId: string; associationId: string }) => {
      const { error } = await api.api.services.products[associationId].delete({
        $query: { profileId },
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medical-service-products", profileId, variables.serviceId] });
      toast.success("Producto removido del servicio");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al remover producto");
      toast.error(errorMessage);
    },
  });

  return removeProduct;
}

/**
 * Hook to update a service-product association
 */
export function useUpdateMedicalServiceProduct(profileId: string) {
  const queryClient = useQueryClient();

  const updateProduct = useMutation({
    mutationFn: async ({ serviceId, associationId, quantityRequired, isRequired, notes, isActive }: {
      serviceId: string;
      associationId: string;
      quantityRequired?: number;
      isRequired?: boolean;
      notes?: string;
      isActive?: boolean;
    }) => {
      const { data, error } = await api.api.services.products[associationId].put({
        quantityRequired,
        isRequired,
        notes,
        isActive,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medical-service-products", profileId, variables.serviceId] });
      toast.success("Producto actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar producto");
      toast.error(errorMessage);
    },
  });

  return updateProduct;
}

/**
 * Hook to replace all products for a service
 */
export function useReplaceMedicalServiceProducts(profileId: string) {
  const queryClient = useQueryClient();

  const replaceProducts = useMutation({
    mutationFn: async ({ serviceId, products }: { serviceId: string; products: Array<{
      productId: string;
      quantityRequired?: number;
      isRequired?: boolean;
      notes?: string;
    }> }) => {
      const { data, error } = await api.api.services[serviceId].products.put({
        products,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medical-service-products", profileId, variables.serviceId] });
      toast.success("Productos actualizados");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar productos");
      toast.error(errorMessage);
    },
  });

  return replaceProducts;
}
