import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MessageRenderer } from "@/components/ai-ui/factory";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AIMessagePart } from "@/components/ai-ui/types";
import { useChat } from "./chat-context";

// Valid part types for the chat
const VALID_PART_TYPES = [
  "text",
  "tool-call",
  "tool-result",
  "services-list",
  "availability",
  "reservation",
  "faq",
  "calendar",
  "patient-form",
  "confirmation",
] as const;

function isRenderablePart(part: { type: string }): part is AIMessagePart {
  return VALID_PART_TYPES.includes(
    part.type as (typeof VALID_PART_TYPES)[number],
  );
}

export interface ChatContentProps {
  handleFormSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  isThinking: boolean;
  doctorName: string;
  showSuggestions: boolean;
  handleSuggestionClick: (suggestion: string) => void;
}

export function ChatContent({
  handleFormSubmit,
  isLoading,
  isThinking,
  doctorName,
  showSuggestions,
  handleSuggestionClick,
}: ChatContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const {
    messages,
    input,
    setInput,
    onSelectService,
    onSelectDate,
    onSelectSlot,
    onSubmitPatientData,
    onConfirm,
  } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const suggestions = [
    "¿Qué servicios ofrecen?",
    "¿Cómo agendo una cita?",
    "¿Cuáles son sus horarios?",
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 space-y-4">
        {messages.length === 0 && !isThinking ? (
          isMobile ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-5 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-base">
                  ¡Hola! Soy el asistente de {doctorName}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
                  Estoy aquí para responder tus preguntas y ayudarte a agendar
                  citas.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-start h-full min-h-[300px] text-left space-y-4 pt-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-base">
                  ¡Hola! Soy el asistente de {doctorName}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Estoy aquí para responder tus preguntas y ayudarte a agendar
                  citas.
                </p>
              </div>
            </div>
          )
        ) : (
          <Conversation>
            <ConversationContent>
              {messages.map((message, index) => {
                const processedParts = message.parts.filter(isRenderablePart);

                return (
                  <Message key={message.id || index} from={message.role}>
                    <MessageContent>
                      <MessageRenderer
                        parts={processedParts}
                        handlers={{
                          onSelectService,
                          onSelectDate,
                          onSelectSlot,
                          onSubmitPatientData,
                          onConfirm,
                        }}
                      />
                    </MessageContent>
                  </Message>
                );
              })}

              {isThinking && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer className="h-4 w-20">Escribiendo...</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
          </Conversation>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && messages.length === 0 && !isThinking && (
        <div className="px-4 pb-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3.5 py-2 text-xs font-medium rounded-full bg-gradient-to-r from-muted to-muted/70 hover:from-primary/10 hover:to-primary/5 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-border/50 px-4 py-4 sm:px-5 bg-gradient-to-t from-muted/20 to-background">
        <form onSubmit={handleFormSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Escribe tu mensaje..."
            className="pr-12 min-h-[48px] max-h-[120px] resize-none rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  handleFormSubmit(e);
                }
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/60 mt-3">
          El asistente puede cometer errores. Verifica información importante.
        </p>
      </div>
    </div>
  );
}
