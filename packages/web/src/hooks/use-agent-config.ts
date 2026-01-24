import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export type TonePreset = "formal" | "professional" | "friendly";

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

interface AgentConfigState {
  config: AgentConfigData | null;
  tonePresets: TonePresetOption[];
  isLoading: boolean;
  isSaving: boolean;
  fetchConfig: (profileId: string) => Promise<void>;
  updateConfig: (
    profileId: string,
    data: Partial<AgentConfigData>,
  ) => Promise<void>;
  fetchTonePresets: () => Promise<void>;
}

export function useAgentConfig(): AgentConfigState {
  const [config, setConfig] = useState<AgentConfigData | null>(null);
  const [tonePresets, setTonePresets] = useState<TonePresetOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTonePresets = useCallback(async () => {
    try {
      const response = await api.api.agent["tone-presets"].get();
      if (response.data && !response.error) {
        setTonePresets(response.data as TonePresetOption[]);
      }
    } catch (error) {
      console.error("Error fetching tone presets:", error);
    }
  }, []);

  const fetchConfig = useCallback(async (profileId: string) => {
    try {
      setIsLoading(true);
      const response = await api.api.agent.config.get({ profileId });

      if (response.error) {
        console.error("Error fetching agent config:", response.error);
        toast.error("Error al cargar configuración del agente");
        return;
      }

      if (response.data) {
        setConfig(response.data as AgentConfigData);
      }
    } catch (error) {
      console.error("Error fetching agent config:", error);
      toast.error("Error al cargar configuración del agente");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(
    async (profileId: string, data: Partial<AgentConfigData>) => {
      try {
        setIsSaving(true);
        const response = await api.api.agent.config.put({
          profileId,
          ...data,
        } as any);

        if (response.error) {
          const errorMessage =
            typeof response.error === "object" && "message" in response.error
              ? (response.error as any).message
              : "Error al guardar configuración";
          toast.error(errorMessage);
          return;
        }

        if (response.data) {
          setConfig(response.data as AgentConfigData);
          toast.success("Configuración guardada correctamente");
        }
      } catch (error) {
        console.error("Error updating agent config:", error);
        toast.error("Error al guardar configuración");
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  // Fetch tone presets on mount
  useEffect(() => {
    fetchTonePresets();
  }, [fetchTonePresets]);

  return {
    config,
    tonePresets,
    isLoading,
    isSaving,
    fetchConfig,
    updateConfig,
    fetchTonePresets,
  };
}

// Hook for suggestions specifically
interface UseSuggestionsReturn {
  suggestions: string[];
  isLoading: boolean;
  updateSuggestions: (
    profileId: string,
    suggestions: string[],
  ) => Promise<void>;
}

export function useSuggestions(profileId: string): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!profileId) return;

    try {
      setIsLoading(true);
      const response = await api.api.agent.suggestions.get({ profileId });

      if (response.data && !response.error) {
        setSuggestions(response.data as string[]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const updateSuggestions = useCallback(
    async (profileId: string, newSuggestions: string[]) => {
      try {
        setIsLoading(true);
        const response = await api.api.agent.config.put({
          profileId,
          suggestions: newSuggestions,
        } as any);

        if (response.data && !response.error) {
          setSuggestions(newSuggestions);
          toast.success("Sugerencias actualizadas");
        }
      } catch (error) {
        console.error("Error updating suggestions:", error);
        toast.error("Error al actualizar sugerencias");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    updateSuggestions,
  };
}
