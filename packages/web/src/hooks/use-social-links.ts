import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useProfile } from "./use-profile"

export interface SocialLink {
  id: string
  platform: "whatsapp" | "instagram" | "tiktok" | "facebook" | "youtube"
  url: string
  displayOrder: number
}

export function useSocialLinks() {
  const queryClient = useQueryClient()
  const { profile } = useProfile()

  const { data: links, isLoading, error } = useQuery({
    queryKey: ["social-links", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await api.api["social-links"].get({
        $query: { profileId: profile.id }
      })
      if (error) throw error
      return (data as unknown as SocialLink[]).sort((a, b) => a.displayOrder - b.displayOrder)
    },
    enabled: !!profile?.id
  })

  const createLink = useMutation({
    mutationFn: async (newLink: Omit<SocialLink, "id" | "displayOrder">) => {
      if (!profile?.id) throw new Error("No profile found")
      const { data, error } = await api.api["social-links"].post({
        profileId: profile.id,
        ...newLink,
        displayOrder: links ? links.length : 0
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] })
      toast.success("Link added")
    },
    onError: () => toast.error("Failed to add link")
  })

  const updateLink = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<SocialLink> }) => {
      const { data: resData, error } = await api.api["social-links"][id].put(data)
      if (error) throw error
      return resData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] })
      toast.success("Link updated")
    },
    onError: () => toast.error("Failed to update link")
  })

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api["social-links"][id].delete()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] })
      toast.success("Link deleted")
    },
    onError: () => toast.error("Failed to delete link")
  })

  const reorderLinks = useMutation({
    mutationFn: async (linkIds: string[]) => {
        if (!profile?.id) throw new Error("No profile")
        const { error } = await api.api["social-links"].reorder.post({
            profileId: profile.id,
            linkIds
        })
        if (error) throw error
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["social-links"] })
        // No toast needed for drag/drop usually, but optional
    },
    onError: () => toast.error("Failed to reorder links")
  })

  return {
    links,
    isLoading,
    error,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks
  }
}
