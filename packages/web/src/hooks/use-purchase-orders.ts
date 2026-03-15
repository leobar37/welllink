import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// Types
export type PurchaseOrderStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  total: string;
  receivedQuantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface PurchaseOrder {
  id: string;
  profileId: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderNumber: string | null;
  expectedDate: string | null;
  total: string;
  tax: string;
  notes: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
  };
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderData {
  profileId?: string;
  supplierId: string;
  orderNumber?: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number | string;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderData {
  supplierId?: string;
  orderNumber?: string;
  expectedDate?: string;
  notes?: string;
  tax?: number | string;
}

export interface ReceivePurchaseOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    location?: string;
    notes?: string;
  }>;
}

export interface CancelPurchaseOrderData {
  reason: string;
}

export type PurchaseOrderListParams = {
  profileId?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  limit?: number;
  offset?: number;
};

// Hooks
export function usePurchaseOrders(profileId: string) {
  const queryClient = useQueryClient();

  const {
    data: purchaseOrders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["purchase-orders", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory["purchase-orders"].get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as PurchaseOrder[];
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const createPurchaseOrder = useMutation({
    mutationFn: async (data: CreatePurchaseOrderData) => {
      const { data: resData, error } = await api.api.inventory["purchase-orders"].post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra creada exitosamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear orden de compra");
      toast.error(errorMessage);
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePurchaseOrderData }) => {
      const { data: resData, error } = await api.api.inventory["purchase-orders"][id].put(data, {
        $query: { profileId },
      });
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra actualizada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar orden de compra");
      toast.error(errorMessage);
    },
  });

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.inventory["purchase-orders"][id].delete({
        $query: { profileId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra eliminada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar orden de compra");
      toast.error(errorMessage);
    },
  });

  const sendPurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.api.inventory["purchase-orders"][id].send.post(undefined, {
        $query: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra enviada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al enviar orden de compra");
      toast.error(errorMessage);
    },
  });

  const receivePurchaseOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReceivePurchaseOrderData }) => {
      const { data: resData, error } = await api.api.inventory["purchase-orders"][id].receive.post(data, {
        $query: { profileId },
      });
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      toast.success("Mercancía recibida correctamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al recibir mercancía");
      toast.error(errorMessage);
    },
  });

  const cancelPurchaseOrder = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await api.api.inventory["purchase-orders"][id].cancel.post({ reason }, {
        $query: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra cancelada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al cancelar orden de compra");
      toast.error(errorMessage);
    },
  });

  return {
    purchaseOrders,
    isLoading,
    error,
    refetch,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    sendPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
  };
}

export function usePurchaseOrder(profileId: string, id: string) {
  const queryClient = useQueryClient();

  const {
    data: purchaseOrder,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["purchase-order", profileId, id],
    queryFn: async () => {
      const { data, error } = await api.api.inventory["purchase-orders"][id].get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as PurchaseOrder;
    },
    enabled: !!profileId && !!id,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const receivePurchaseOrder = useMutation({
    mutationFn: async (data: ReceivePurchaseOrderData) => {
      const { data: resData, error } = await api.api.inventory["purchase-orders"][id].receive.post(data, {
        $query: { profileId },
      });
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", profileId, id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      toast.success("Mercancía recibida correctamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al recibir mercancía");
      toast.error(errorMessage);
    },
  });

  const sendPurchaseOrder = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.inventory["purchase-orders"][id].send.post(undefined, {
        $query: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", profileId, id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra enviada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al enviar orden de compra");
      toast.error(errorMessage);
    },
  });

  const cancelPurchaseOrder = useMutation({
    mutationFn: async (reason: string) => {
      const { data, error } = await api.api.inventory["purchase-orders"][id].cancel.post({ reason }, {
        $query: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", profileId, id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", profileId] });
      toast.success("Orden de compra cancelada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al cancelar orden de compra");
      toast.error(errorMessage);
    },
  });

  return {
    purchaseOrder,
    isLoading,
    error,
    refetch,
    receivePurchaseOrder,
    sendPurchaseOrder,
    cancelPurchaseOrder,
  };
}
