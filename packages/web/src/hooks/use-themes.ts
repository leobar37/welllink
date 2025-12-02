import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { THEMES, type ThemeDefinition } from "@/lib/themes";

interface ProfileThemeResponse {
  themeId: string;
  theme: ThemeDefinition;
}

/**
 * Hook to get all available themes
 * Uses local data instead of API call since themes are static
 */
export function useAvailableThemes() {
  return useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      // We can use local data since themes are static
      // But let's fetch from API to stay consistent
      const { data, error } = await api.api.themes.get();
      if (error) throw error;
      return data as unknown as ThemeDefinition[];
    },
    // Use static data as initial/fallback
    initialData: THEMES,
    staleTime: Infinity, // Themes don't change
  });
}

/**
 * Hook to get the current theme for a profile
 */
export function useProfileTheme(profileId?: string) {
  return useQuery({
    queryKey: ["profile-theme", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await api.api.themes.profiles[profileId].get();
      if (error) throw error;
      return data as unknown as ProfileThemeResponse;
    },
    enabled: !!profileId,
  });
}

/**
 * Hook to update the theme for a profile
 */
export function useUpdateProfileTheme(profileId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (themeId: string) => {
      if (!profileId) throw new Error("Profile ID is required");
      const { data, error } = await api.api.themes.profiles[profileId].put({
        themeId,
      });
      if (error) throw error;
      return data as unknown as ProfileThemeResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-theme", profileId] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Tema actualizado correctamente");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Error al actualizar el tema");
    },
  });
}

/**
 * Combined hook for theme management in the dashboard
 */
export function useThemeManager(profileId?: string) {
  const availableThemes = useAvailableThemes();
  const profileTheme = useProfileTheme(profileId);
  const updateTheme = useUpdateProfileTheme(profileId);

  return {
    themes: availableThemes.data ?? THEMES,
    isLoadingThemes: availableThemes.isLoading,
    currentThemeId: profileTheme.data?.themeId ?? "default",
    isLoadingCurrentTheme: profileTheme.isLoading,
    updateTheme: updateTheme.mutate,
    isUpdating: updateTheme.isPending,
  };
}
