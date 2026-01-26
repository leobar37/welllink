import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5300";

export type WhatsAppContextStatus =
  | "ACTIVE"
  | "PAUSED_FOR_HUMAN"
  | "TRANSFERRED_TO_WIDGET";

export interface WhatsAppContext {
  phone: string;
  profileId: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
  contextSummary: string | null;
  lastInteractionAt: string | null;
  status: WhatsAppContextStatus;
  transferredToWidgetAt: string | null;
  pausedForHumanAt: string | null;
  patientId: string | null;
  createdAt: string;
  updatedAt: string;
  profileName?: string;
}

export interface ConversationListResponse {
  conversations: WhatsAppContext[];
  total: number;
  status?: WhatsAppContextStatus;
}

async function fetchConversations(params?: {
  profileId?: string;
  status?: WhatsAppContextStatus;
}): Promise<ConversationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.profileId) searchParams.set("profileId", params.profileId);
  if (params?.status) searchParams.set("status", params.status);

  const url = `${API_URL}/api/conversations${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

async function fetchPausedConversations(): Promise<ConversationListResponse> {
  const response = await fetch(`${API_URL}/api/conversations/paused`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch paused conversations");
  }

  return response.json();
}

async function fetchConversation(phone: string): Promise<WhatsAppContext> {
  const response = await fetch(`${API_URL}/api/conversations/${phone}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  return response.json();
}

async function pauseConversation(phone: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/conversations/${phone}/pause`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to pause conversation");
  }
}

async function resumeConversation(phone: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/conversations/${phone}/resume`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to resume conversation");
  }
}

export function useConversations(profileId?: string) {
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversations", profileId],
    queryFn: async () => fetchConversations({ profileId }),
    enabled: true,
  });

  return {
    conversations: conversations?.conversations || [],
    total: conversations?.total || 0,
    isLoading,
    error,
  };
}

export function usePausedConversations() {
  const queryClient = useQueryClient();

  const {
    data: pausedConversations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations", "paused"],
    queryFn: fetchPausedConversations,
    enabled: true,
  });

  const resumeMutation = useMutation({
    mutationFn: resumeConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversación reanudada");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al reanudar conversación",
      );
      toast.error(errorMessage);
    },
  });

  return {
    pausedConversations: pausedConversations?.conversations || [],
    total: pausedConversations?.total || 0,
    isLoading,
    error,
    refetch,
    resumeConversation: resumeMutation.mutateAsync,
  };
}

export function useConversation(phone: string) {
  const {
    data: conversation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversation", phone],
    queryFn: async () => fetchConversation(phone),
    enabled: !!phone,
  });

  return {
    conversation,
    isLoading,
    error,
  };
}

export function usePauseConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversación pausada para atención humana");
    },
    onError: (err: unknown) => {
      const errorMessage = extractErrorMessage(
        err,
        "Error al pausar conversación",
      );
      toast.error(errorMessage);
    },
  });
}
