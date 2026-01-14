import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

export interface Asset {
  id: string;
  userId: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  type?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  url?: string; // URL generada por el backend
}

export type AssetType = "image" | "document" | "avatar" | "cover" | "story-image";

export interface AssetStats {
  totalAssets: number;
  totalSize: number;
  assetsByType: Record<string, { count: number; totalSize: number }>;
}

export function useAssets(userId?: string) {
  const queryClient = useQueryClient();

  // Listar assets
  const {
    data: assets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assets", userId],
    queryFn: async () => {
      const queryObj: { userId?: string } = {};
      if (userId) queryObj.userId = userId;
      
      const { data, error } = await api.api.assets.get({
        $query: queryObj,
      });
      if (error) throw error;
      return data as unknown as Asset[];
    },
    enabled: !!userId,
  });

  // Listar assets por tipo
  const getAssetsByType = (type: AssetType) => {
    return useQuery({
      queryKey: ["assets", userId, "type", type],
      queryFn: async () => {
        const queryObj: { userId?: string; type: string } = { type };
        if (userId) queryObj.userId = userId;
        
        const { data, error } = await api.api.assets.get({
          $query: queryObj,
        });
        if (error) throw error;
        return data as unknown as Asset[];
      },
      enabled: !!userId && !!type,
    });
  };

  // Obtener estadísticas
  const getAssetStats = (statsUserId?: string) => {
    return useQuery({
      queryKey: ["assets-stats", statsUserId],
      queryFn: async () => {
        const queryObj: { userId?: string } = {};
        if (statsUserId) queryObj.userId = statsUserId;
        
        const { data, error } = await api.api.assets.stats.get({
          $query: queryObj,
        });
        if (error) throw error;
        return data as unknown as AssetStats;
      },
      enabled: !!statsUserId,
    });
  };

  // Subir archivo
  const uploadAsset = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: AssetType }) => {
      const { data, error } = await api.api.upload.post({
        file,
        type,
      });
      if (error) throw error;
      return data as unknown as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      toast.success("Archivo subido exitosamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al subir archivo");
      toast.error(errorMessage);
    },
  });

  // Eliminar asset
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.assets[id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      toast.success("Archivo eliminado");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Error al eliminar archivo");
      toast.error(errorMessage);
    },
  });

  return {
    assets,
    isLoading,
    error,
    getAssetsByType,
    getAssetStats,
    uploadAsset,
    deleteAsset,
  };
}

export function useAssetUrl(assetId?: string | null) {
  return useQuery({
    queryKey: ["asset-url", assetId],
    queryFn: async () => {
      if (!assetId) return null;
      const { data, error } = await api.api.assets[assetId].url.get();
      if (error) throw error;
      return data.url as string;
    },
    enabled: !!assetId,
    staleTime: Infinity, // Asset URLs don't change
  });
}
