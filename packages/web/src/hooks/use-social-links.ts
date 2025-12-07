import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "./use-profile";
import { extractErrorMessage } from "@/lib/error-handler";

export interface SocialLink {
  id: string;
  platform: "whatsapp" | "instagram" | "tiktok" | "facebook" | "youtube";
  url: string;
  displayOrder: number;
}

export function useSocialLinks() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const {
    data: links,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["social-links", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api["social-links"].get({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return (data as unknown as SocialLink[]).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
    },
    enabled: !!profile?.id,
  });

  const createLink = useMutation({
    mutationFn: async (newLink: Omit<SocialLink, "id" | "displayOrder">) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } = await api.api["social-links"].post({
        profileId: profile.id,
        ...newLink,
        displayOrder: links ? links.length : 0,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Link added");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Failed to add link");
      toast.error(errorMessage);
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SocialLink>;
    }) => {
      const { data: resData, error } =
        await api.api["social-links"][id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Link updated");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Failed to update link");
      toast.error(errorMessage);
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api["social-links"][id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Link deleted");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Failed to delete link");
      toast.error(errorMessage);
    },
  });

  const reorderLinks = useMutation({
    mutationFn: async (linkIds: string[]) => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await api.api["social-links"].reorder.post({
        profileId: profile.id,
        linkIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      // No toast needed for drag/drop usually, but optional
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(err, "Failed to reorder links");
      toast.error(errorMessage);
    },
  });

  return {
    links,
    isLoading,
    error,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
  };
}
