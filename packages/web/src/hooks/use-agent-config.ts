import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-handler";

export const TonePresetValues = ["formal", "professional", "friendly"] as const;
export type TonePreset = (typeof TonePresetValues)[number];

export interface AgentConfigData {
  id: string;
  profileId: string;
  tonePreset: TonePreset;
  customInstructions?: string;
  welcomeMessage: string;
  farewellMessage?: string;
  suggestions: string[];
  widgetEnabled: boolean;
  widgetPosition: "bottom-right" | "bottom-left";
  widgetPrimaryColor?: string;
  whatsappEnabled: boolean;
  whatsappAutoTransfer: boolean;
  whatsappMaxMessageLength: number;
}

interface TonePresetOption {
  id: TonePreset;
  description: string;
}

// Query Keys
const agentConfigKeys = {
  all: ["agent-config"] as const,
  byProfile: (profileId: string) =>
    [...agentConfigKeys.all, profileId] as const,
};

const tonePresetsKeys = {
  all: ["tone-presets"] as const,
};

const suggestionsKeys = {
  all: ["suggestions"] as const,
  byProfile: (profileId: string) =>
    [...suggestionsKeys.all, profileId] as const,
};

// Fetcher Functions
async function fetchAgentConfig(profileId: string): Promise<AgentConfigData> {
  const { data, error } = await api.api.agent.config.get({
    $query: { profileId },
  });
  if (error) throw error;
  return data as unknown as AgentConfigData;
}

async function fetchTonePresets(): Promise<TonePresetOption[]> {
  const { data, error } = await api.api.agent["tone-presets"].get();
  if (error) throw error;

  // Handle both { data: [...] } and [...] response formats
  const presetsData = Array.isArray(data)
    ? data
    : (data as { data?: TonePresetOption[] }).data || [];
  return presetsData as TonePresetOption[];
}

async function fetchSuggestions(profileId: string): Promise<string[]> {
  const { data, error } = await api.api.agent.suggestions.get({
    $query: { profileId },
  });
  if (error) throw error;
  return data as unknown as string[];
}

async function updateAgentConfig(
  profileId: string,
  configData: Partial<AgentConfigData>,
): Promise<AgentConfigData> {
  const { data, error } = await api.api.agent.config.put({
    profileId,
    ...configData,
  });
  if (error) throw error;
  return data as unknown as AgentConfigData;
}

async function updateSuggestions(
  profileId: string,
  suggestions: string[],
): Promise<void> {
  const { error } = await api.api.agent.config.put({
    profileId,
    suggestions,
  });
  if (error) throw error;
}

// Hooks
export function useAgentConfig(profileId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: agentConfigKeys.byProfile(profileId || ""),
    queryFn: () => fetchAgentConfig(profileId!),
    enabled: !!profileId,
  });

  const updateConfig = useMutation({
    mutationFn: (data: Partial<AgentConfigData>) =>
      updateAgentConfig(profileId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentConfigKeys.all });
      toast.success("Configuración guardada correctamente");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al guardar configuración",
      );
      toast.error(errorMessage);
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig,
  };
}

export function useTonePresets() {
  const {
    data: tonePresets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tonePresetsKeys.all,
    queryFn: fetchTonePresets,
  });

  return {
    tonePresets,
    isLoading,
    error,
  };
}

export function useSuggestions(profileId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: suggestionsKeys.byProfile(profileId || ""),
    queryFn: () => fetchSuggestions(profileId!),
    enabled: !!profileId,
  });

  const updateSuggestionsMutation = useMutation({
    mutationFn: (newSuggestions: string[]) =>
      updateSuggestions(profileId!, newSuggestions),
    onSuccess: (_, newSuggestions) => {
      queryClient.setQueryData(
        suggestionsKeys.byProfile(profileId!),
        newSuggestions,
      );
      toast.success("Sugerencias actualizadas");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al actualizar sugerencias",
      );
      toast.error(errorMessage);
    },
  });

  return {
    suggestions,
    isLoading,
    error,
    updateSuggestions: updateSuggestionsMutation.mutate,
  };
}
