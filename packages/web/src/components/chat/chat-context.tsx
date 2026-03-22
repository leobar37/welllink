import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type { UIMessage } from "ai";
import type {
  AIMessagePart,
  PatientFormData,
  ServiceData,
  SlotData,
} from "@/components/ai-ui/types";

const API_URL = import.meta.env.VITE_API_URL || "";

// ============================================
// Types
// ============================================

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface ChatState {
  messages: UIMessage[];
  input: string;
  status: ChatStatus;
}

interface ChatContextValue {
  // State (read-only)
  messages: UIMessage[];
  input: string;
  status: ChatStatus;
  isLoading: boolean;
  // Actions
  setMessages: (fn: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  setInput: (input: string) => void;
  setStatus: (status: ChatStatus) => void;
  // Functions
  sendMessage: (text: string) => Promise<void>;
  stop: () => void;
  // Event handlers
  onSelectService: (service: ServiceData) => void;
  onSelectDate: (date: string, serviceId?: string) => void;
  onSelectSlot: (slot: SlotData, date: string, serviceId?: string) => void;
  onSubmitPatientData: (data: PatientFormData) => void;
  onConfirm: (data?: unknown) => void;
}

// ============================================
// Utilities
// ============================================

function createTextMessage(
  role: "user" | "assistant",
  text: string,
): UIMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    parts: [{ type: "text" as const, text }],
  };
}

function createStructuredMessage(
  role: "user" | "assistant",
  parts: AIMessagePart[],
): UIMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    parts: parts as UIMessage["parts"],
  };
}

function stripJsonBlocksFromText(text: string): string {
  return text.replace(/```json\s*[\s\S]*?```/g, "").trim();
}

function formatSlotTime(startTime: string): string {
  return new Date(startTime).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getSessionKey(profileId: string): string {
  return `chat_session_${profileId}`;
}

function getOrCreateSessionId(profileId: string): string {
  const key = getSessionKey(profileId);
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const newId = `webchat:${profileId}:${crypto.randomUUID()}`;
  localStorage.setItem(key, newId);
  return newId;
}

// ============================================
// Context
// ============================================

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

interface ChatProviderProps {
  children: ReactNode;
  profileId: string;
}

export function ChatProvider({ children, profileId }: ChatProviderProps) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    input: "",
    status: "ready",
  });
  const [conversationId, setConversationId] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const { messages, input, status } = state;

  const setMessages = useCallback(
    (fn: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => {
      setState((prev) => ({
        ...prev,
        messages: fn instanceof Function ? fn(prev.messages) : fn,
      }));
    },
    [],
  );

  // Initialize session and load history on mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId(profileId);
    setConversationId(sessionId);

    // Load conversation history
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/agent/conversations/${encodeURIComponent(sessionId)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const historicalMessages: UIMessage[] = data.messages.map(
              (msg: {
                id: string;
                role: "user" | "assistant";
                content: string;
              }) => createTextMessage(msg.role, msg.content),
            );
            setMessages(historicalMessages);
          }
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
      }
    };

    loadHistory();
  }, [profileId, setMessages]);

  const setInput = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input }));
  }, []);

  const setStatus = useCallback((status: ChatStatus) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || status === "submitted" || status === "streaming") {
        return;
      }

      const userMessage = createTextMessage("user", text);

      setMessages((prev) => [
        ...prev,
        userMessage,
        createTextMessage("assistant", ""),
      ]);
      setInput("");
      setStatus("streaming");

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${API_URL}/api/agent/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            profileId,
            conversationId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        readerRef.current = response.body.getReader();
        const reader = readerRef.current;
        const decoder = new TextDecoder();
        let accumulatedText = "";
        let structuredParts: AIMessagePart[] | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "conversation-id") {
                  // Save the conversationId if it's new
                  const newId = parsed.conversationId;
                  if (newId && newId !== conversationId) {
                    setConversationId(newId);
                    localStorage.setItem(getSessionKey(profileId), newId);
                  }
                } else if (parsed.type === "text-delta") {
                  accumulatedText += parsed.textDelta || parsed.text || "";

                  const displayText = stripJsonBlocksFromText(accumulatedText);

                  setMessages((prevMessages) => {
                    const updated = [...prevMessages];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        parts: [{ type: "text" as const, text: displayText }],
                      };
                    }
                    return updated;
                  });
                } else if (parsed.type === "structured-parts") {
                  structuredParts = parsed.parts;
                }
              } catch {
                // Ignore parse errors for non-JSON lines
              }
            }
          }
        }

        // Apply structured response if available
        if (structuredParts) {
          setMessages((prevMessages) => {
            const updated = [...prevMessages];
            if (updated.length > 0) {
              updated[updated.length - 1] = createStructuredMessage(
                "assistant",
                structuredParts,
              );
            }
            return updated;
          });
        }

        setStatus("ready");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Chat error:", error);
        setStatus("error");

        setMessages((prevMessages) => prevMessages.slice(0, -1));
      } finally {
        readerRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [status, profileId, conversationId, setMessages, setInput, setStatus],
  );

  const stop = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("ready");
  }, [setStatus]);

  const onSelectService = useCallback(
    (service: ServiceData) => {
      sendMessage(`El usuario seleccionó el servicio desde la tarjeta interactiva.
Servicio seleccionado:
- ID: ${service.id}
- Nombre: ${service.name}
- Duración: ${service.duration}
- Precio: ${service.price}

Continúa inmediatamente el flujo de agendamiento.
NO vuelvas a listar servicios ni repitas su descripción.
Responde con una confirmación muy breve y luego muestra disponibilidad o calendario para este servicio.`);
    },
    [sendMessage],
  );

  const onSelectDate = useCallback(
    (date: string, serviceId?: string) => {
      if (!serviceId) {
        return;
      }

      sendMessage(`El usuario seleccionó la fecha ${date} para continuar el agendamiento del servicio ${serviceId}.
Verifica disponibilidad para esa fecha y responde con los horarios disponibles.
NO vuelvas a listar servicios.`);
    },
    [sendMessage],
  );

  const onSelectSlot = useCallback(
    (slot: SlotData, date: string, serviceId?: string) => {
      if (!serviceId) {
        return;
      }

      const time = formatSlotTime(slot.startTime);

      sendMessage(`El usuario seleccionó este horario para agendar:
- Servicio ID: ${serviceId}
- Fecha: ${date}
- Hora: ${time}
- Slot ID: ${slot.id}

Continúa con el siguiente paso del flujo y muestra el formulario patient-form.
NO vuelvas a listar servicios ni horarios.`);
    },
    [sendMessage],
  );

  const onSubmitPatientData = useCallback(
    (data: PatientFormData) => {
      const message = `El usuario completó los datos del paciente para la cita.
Datos del paciente:
- Nombre: ${data.name}
- Teléfono: ${data.phone}
- Email: ${data.email || "No proporcionado"}
- Motivo: ${data.chiefComplaint || "No proporcionado"}

Datos de la cita:
- Slot ID: ${data.slotId}
- Servicio ID: ${data.serviceId}
- Servicio: ${data.serviceName}
- Fecha: ${data.date}
- Hora: ${data.time}

Continúa con el paso final de confirmación usando confirmation.
NO vuelvas a pedir estos mismos datos.`;
      sendMessage(message);
    },
    [sendMessage],
  );

  const onConfirm = useCallback(
    (data?: unknown) => {
      const serializedData = data ? JSON.stringify(data) : "{}";

      sendMessage(`El usuario confirmó la reserva y quiere finalizar el agendamiento.
Datos de confirmación: ${serializedData}

Usa la información ya recopilada en la conversación para crear la reserva.
NO vuelvas a listar servicios ni a pedir confirmación de nuevo.`);
    },
    [sendMessage],
  );

  const value: ChatContextValue = {
    messages,
    input,
    status,
    isLoading: status === "submitted" || status === "streaming",
    setMessages,
    setInput,
    setStatus,
    sendMessage,
    stop,
    onSelectService,
    onSelectDate,
    onSelectSlot,
    onSubmitPatientData,
    onConfirm,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
