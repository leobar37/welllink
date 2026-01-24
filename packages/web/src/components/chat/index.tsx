import { useState, useCallback, useRef } from "react";
import type { UIMessage } from "ai";
import { ChatButton } from "./chat-button";
import { ChatDrawer } from "./chat-drawer";
import type { AIMessagePart } from "@/components/ai-ui/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5300";

interface ChatWidgetProps {
  profileId: string;
  doctorName: string;
}

interface ChatState {
  messages: UIMessage[];
  input: string;
  status: "ready" | "submitted" | "streaming" | "error";
}

interface AgentResponse {
  success: boolean;
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  parts: AIMessagePart[] | null;
  hasStructuredResponse: boolean;
}

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

export function ChatWidget({ profileId, doctorName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState<ChatState>({
    messages: [],
    input: "",
    status: "ready",
  });
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const setInput = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input }));
  }, []);

  const setStatus = useCallback((status: ChatState["status"]) => {
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
      setStatus("submitted");

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${API_URL}/api/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            profileId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data: AgentResponse = await response.json();

        setMessages((prevMessages) => {
          const updated = [...prevMessages];
          if (updated.length > 0) {
            if (data.hasStructuredResponse && data.parts) {
              updated[updated.length - 1] = createStructuredMessage(
                "assistant",
                data.parts,
              );
            } else {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                parts: [{ type: "text" as const, text: data.text || "" }],
              };
            }
          }
          return updated;
        });

        setStatus("ready");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Chat error:", error);
        setStatus("error");

        setMessages((prevMessages) => prevMessages.slice(0, -1));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [status, profileId, setMessages, setInput, setStatus],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus("ready");
    }
  }, [setStatus]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    stop();
  }, [stop]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      await sendMessage(input);
    },
    [input, sendMessage],
  );

  const onSelectService = useCallback(
    (service: any) => {
      sendMessage(`Me gustaría agendar: ${service.name}`);
    },
    [sendMessage],
  );

  const onSubmitPatientData = useCallback(
    (data: any) => {
      const message = `Datos del paciente:
- Nombre: ${data.name}
- Teléfono: ${data.phone}
- Email: ${data.email || "No proporcionado"}
- Motivo: ${data.chiefComplaint || "No proporcionado"}

Slot: ${data.slotId}, Servicio: ${data.serviceName} el ${data.date} a las ${data.time}`;
      sendMessage(message);
    },
    [sendMessage],
  );

  return (
    <>
      <ChatButton
        isOpen={isOpen}
        onClick={isOpen ? handleClose : handleOpen}
        unreadCount={unreadCount}
      />

      <ChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={status === "submitted" || status === "streaming"}
        status={status}
        doctorName={doctorName}
        onSelectService={onSelectService}
        onSubmitPatientData={onSubmitPatientData}
      />
    </>
  );
}
