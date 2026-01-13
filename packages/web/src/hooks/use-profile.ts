import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// We need to define the type manually since we can't import it from API yet (or we can try)
// For now let's define a subset
interface Profile {
  id: string;
  username: string;
  displayName: string;
  title?: string;
  bio?: string;
  whatsappNumber?: string;
  avatarId?: string;
  coverImageId?: string;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const {
    data: profiles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await api.api.profiles.get();
      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // We assume single profile for now
  const profile = profiles?.[0];

  const updateProfile = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Profile>;
    }) => {
      const { data: resData, error } = await api.api.profiles[id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Profile updated");
    },
    onError: (err: unknown) => {
      console.error("Profile update error:", err);
      const errorMessage = extractErrorMessage(err, "Failed to update profile");
      toast.error(errorMessage);
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await api.api.upload.post({
        file,
        type: "avatar",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (profile) {
        updateProfile.mutate({
          id: profile.id,
          data: { avatarId: data.id },
        });
      }
    },
    onError: (err: unknown) => {
      console.error("Avatar upload error:", err);
      const errorMessage = extractErrorMessage(err, "Failed to upload avatar");
      toast.error(errorMessage);
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
  };
}

export function useProfileStats(profileId?: string) {
  return useQuery({
    queryKey: ["profile-stats", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await api.api.profiles[profileId].stats.get();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}
