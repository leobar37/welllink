import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProfile } from "./use-profile";

export interface HealthSurvey {
  id: string;
  profileId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorWhatsapp?: string;
  referredBy?: string;
  responses: Record<string, unknown>;
  whatsappSentAt?: Date;
  createdAt: Date;
}

export function useHealthSurveys() {
  const { profile } = useProfile();

  const {
    data: surveys,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["health-surveys", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api["health-survey"].get({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return (data as HealthSurvey[]).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!profile?.id,
  });

  return {
    surveys,
    isLoading,
    error,
  };
}
