import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// Types
export interface Product {
  id: string;
  profileId: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  cost: string | null;
  unit: string;
  minStock: number;
  categoryId: string | null;
  supplierId: string | null;
  barcode: string | null;
  hasExpiration: boolean;
  expirationDays: number | null;
  brand: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  category?: ProductCategory | null;
  supplier?: Supplier | null;
  inventoryItem?: InventoryItem | null;
}

export interface ProductCategory {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  profileId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Supplier-product association with product details
 */
export interface SupplierProductWithProduct {
  id: string;
  profileId: string;
  supplierId: string;
  productId: string;
  supplierSku: string | null;
  costPrice: string | null;
  leadTimeDays: number | null;
  minOrderQty: number | null;
  isPrimary: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Product details
  product: Product;
}

export interface InventoryItem {
  id: string;
  profileId: string;
  productId: string;
  location: string;
  quantity: number;
  reservedQuantity: number;
  averageCost: string | null;
  lastRestockedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  profileId: string;
  productId: string;
  inventoryItemId: string | null;
  userId: string | null;
  reason: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  location: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  product?: Product;
  user?: {
    id: string;
    name: string;
  };
}

export interface InventoryValue {
  totalValue: number;
  totalItems: number;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string | null;
    totalValue: number;
    totalItems: number;
  }>;
}

// Create/Update types
export interface CreateProductData {
  profileId?: string;
  sku: string;
  name: string;
  description?: string;
  price: number | string;
  cost?: number | string;
  unit?: string;
  minStock?: number;
  categoryId?: string;
  supplierId?: string;
  barcode?: string;
  hasExpiration?: boolean;
  expirationDays?: number;
  brand?: string;
  notes?: string;
  initialStock?: number;
  location?: string;
}

export interface UpdateProductData {
  sku?: string;
  name?: string;
  description?: string;
  price?: number | string;
  cost?: number | string;
  unit?: string;
  minStock?: number;
  categoryId?: string;
  supplierId?: string;
  barcode?: string;
  hasExpiration?: boolean;
  expirationDays?: number;
  brand?: string;
  notes?: string;
}

export interface StockAdjustmentData {
  profileId?: string;
  productId: string;
  quantity: number;
  reason: "purchase" | "sale" | "damage" | "return" | "adjustment" | "initial" | "transfer" | "expired";
  location?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateSupplierData {
  profileId?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  notes?: string;
}

export interface UpdateSupplierData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  notes?: string;
  isActive?: boolean;
}

// API Functions
export function useInventoryProducts(profileId: string) {
  const queryClient = useQueryClient();

  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory-products", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.products.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductData) => {
      const { data: resData, error } = await api.api.inventory.products.post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      toast.success("Producto creado exitosamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear producto");
      toast.error(errorMessage);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductData }) => {
      const { data: resData, error } = await api.api.inventory.products[id].put(data, {
        $query: { profileId },
      });
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      toast.success("Producto actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar producto");
      toast.error(errorMessage);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.inventory.products[id].delete({
        $query: { profileId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      toast.success("Producto eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar producto");
      toast.error(errorMessage);
    },
  });

  return {
    products,
    isLoading,
    error,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

export function useStockAdjustment(profileId: string) {
  const queryClient = useQueryClient();

  const adjustStock = useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      const { data: resData, error } = await api.api.inventory.adjust.post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products", profileId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", profileId] });
      queryClient.invalidateQueries({ queryKey: ["low-stock", profileId] });
      toast.success("Stock ajustado correctamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al ajustar stock");
      toast.error(errorMessage);
    },
  });

  const getStock = async (productId: string) => {
    const { data, error } = await api.api.inventory.stock[productId].get({
      $query: { profileId },
    });
    if (error) throw error;
    return data;
  };

  return {
    adjustStock,
    getStock,
  };
}

export function useStockMovements(profileId: string) {
  const {
    data: movements,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stock-movements", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.movements.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as StockMovement[];
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    movements,
    isLoading,
    error,
    refetch,
  };
}

export function useLowStockProducts(profileId: string) {
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["low-stock", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory["low-stock"].get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    lowStockProducts: products,
    isLoading,
    error,
    refetch,
  };
}

export function useInventoryValue(profileId: string) {
  const {
    data: value,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory-value", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.value.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as InventoryValue;
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    inventoryValue: value,
    isLoading,
    error,
    refetch,
  };
}

// Supplier hooks
export function useSuppliers(profileId: string) {
  const queryClient = useQueryClient();

  const {
    data: suppliers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["suppliers", profileId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.suppliers.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as Supplier[];
    },
    enabled: !!profileId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const createSupplier = useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const { data: resData, error } = await api.api.inventory.suppliers.post(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", profileId] });
      toast.success("Proveedor creado exitosamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al crear proveedor");
      toast.error(errorMessage);
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierData }) => {
      const { data: resData, error } = await api.api.inventory.suppliers[id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", profileId] });
      toast.success("Proveedor actualizado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al actualizar proveedor");
      toast.error(errorMessage);
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.inventory.suppliers[id].delete({
        $query: { profileId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", profileId] });
      toast.success("Proveedor eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar proveedor");
      toast.error(errorMessage);
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    refetch,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

/**
 * Hook to fetch a single supplier by ID
 */
export function useSupplier(profileId: string, supplierId: string) {
  const {
    data: supplier,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["supplier", profileId, supplierId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.suppliers[supplierId].get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as Supplier;
    },
    enabled: !!profileId && !!supplierId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    supplier,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch products associated with a supplier
 */
export function useSupplierProducts(profileId: string, supplierId: string) {
  const {
    data: supplierProducts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["supplier-products", profileId, supplierId],
    queryFn: async () => {
      const { data, error } = await api.api.inventory.suppliers[supplierId].products.get({
        $query: { profileId },
      });
      if (error) throw error;
      return data as unknown as SupplierProductWithProduct[];
    },
    enabled: !!profileId && !!supplierId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  return {
    supplierProducts,
    isLoading,
    error,
    refetch,
  };
}

// Categories hooks - Product categories are included in product responses
// Note: API endpoint for product-categories not yet implemented
export function useProductCategories(_profileId: string) {
  // Categories are fetched as part of product queries
  // This hook can be extended when product-categories API is available
  return {
    categories: [],
    isLoading: false,
    error: null,
  };
}
