import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-handler";
import type { FAQItem, FAQConfig } from "@/types/faq";

// Query Keys
const faqKeys = {
  all: ["faq-config"] as const,
  byProfile: (profileId: string) => [...faqKeys.all, profileId] as const,
};

// Fetcher Functions
async function fetchFAQConfig(profileId: string): Promise<FAQConfig> {
  const { data, error } = await api.api.profiles[profileId]["faq-config"].get();
  if (error) throw error;
  return data as unknown as FAQConfig;
}

async function updateFAQConfig(
  profileId: string,
  faqs: FAQItem[],
): Promise<FAQConfig> {
  const { data, error } = await api.api.profiles[profileId]["faq-config"].put({
    faqs,
  });
  if (error) throw error;
  return data as unknown as FAQConfig;
}

// Hooks
export function useFAQConfig(profileId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: faqKeys.byProfile(profileId || ""),
    queryFn: () => fetchFAQConfig(profileId!),
    enabled: !!profileId,
  });

  const updateConfig = useMutation({
    mutationFn: (faqs: FAQItem[]) => updateFAQConfig(profileId!, faqs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
      toast.success("Preguntas frecuentes actualizadas");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al actualizar preguntas frecuentes",
      );
      toast.error(errorMessage);
    },
  });

  return {
    faqs: config?.faqs || [],
    isLoading,
    error,
    updateFAQ: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}
