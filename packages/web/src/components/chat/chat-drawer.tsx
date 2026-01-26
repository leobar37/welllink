import { Bot } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MessageRenderer } from "@/components/ai-ui/factory";
import type { AIMessagePart } from "@/components/ai-ui/types";
import { useState, useCallback, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  doctorName: string;
  onSelectService?: (service: any) => void;
  onSubmitPatientData?: (data: any) => void;
}

function ChatContent({
  messages,
  input,
  setInput,
  handleFormSubmit,
  isLoading,
  isThinking,
  doctorName,
  showSuggestions,
  handleSuggestionClick,
  onSelectService,
  onSubmitPatientData,
}: {
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  handleFormSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  isThinking: boolean;
  doctorName: string;
  showSuggestions: boolean;
  handleSuggestionClick: (suggestion: string) => void;
  onSelectService?: (service: any) => void;
  onSubmitPatientData?: (data: any) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const suggestions = [
    "¿Qué servicios ofrecen?",
    "¿Cómo agendo una cita?",
    "¿Cuáles son sus horarios?",
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isThinking ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">
                ¡Hola! Soy el asistente de {doctorName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Estoy aquí para responder tus preguntas y ayudarte a agendar
                citas.
              </p>
            </div>
          </div>
        ) : (
          <Conversation>
            <ConversationContent>
              {messages.map((message, index) => {
                // Process message parts - filter and convert to AIMessagePart format
                const processedParts: AIMessagePart[] = message.parts
                  .filter((part) => {
                    // Only include parts that match our supported types
                    const validTypes = [
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
                    ];
                    return validTypes.includes(part.type);
                  })
                  .map((part) => part as unknown as AIMessagePart);

                return (
                  <Message key={message.id || index} from={message.role}>
                    <MessageContent>
                      <MessageRenderer
                        parts={processedParts}
                        handlers={{ onSelectService, onSubmitPatientData }}
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
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 border-t p-4 bg-background">
        <form onSubmit={handleFormSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Escribe tu mensaje..."
            className="pr-12 min-h-[44px] max-h-[120px] resize-none"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/50 mt-2">
          El asistente puede cometer errores. Verifica información importante.
        </p>
      </div>
    </>
  );
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  input,
  setInput,
  handleSubmit,
  isLoading,
  status,
  doctorName,
  onSelectService,
  onSubmitPatientData,
}: ChatDrawerProps) {
  const isMobile = useIsMobile();
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(event);
        setShowSuggestions(false);
      }
    },
    [input, isLoading, handleSubmit],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      setShowSuggestions(false);
    },
    [setInput],
  );

  const isThinking = status === "submitted" || status === "streaming";

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium">Asistente de {doctorName}</div>
          <div className="text-xs text-muted-foreground">
            {isThinking ? "Escribiendo..." : "En línea"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose} direction="bottom">
          <DrawerContent className="w-full max-w-full h-[80vh] rounded-t-lg overflow-hidden">
            <DrawerHeader className="flex-shrink-0 border-b px-4 py-3 bg-muted/30">
              <DrawerTitle className="sr-only">
                Chat con {doctorName}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Asistente virtual para responder tus preguntas
              </DrawerDescription>
              {header}
            </DrawerHeader>
            <ChatContent
              messages={messages}
              input={input}
              setInput={setInput}
              handleFormSubmit={handleFormSubmit}
              isLoading={isLoading}
              isThinking={isThinking}
              doctorName={doctorName}
              showSuggestions={showSuggestions}
              handleSuggestionClick={handleSuggestionClick}
              onSelectService={onSelectService}
              onSubmitPatientData={onSubmitPatientData}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent
            side="left"
            className="w-full max-w-md flex flex-col h-full"
          >
            <SheetHeader className="flex-shrink-0 border-b px-4 py-3 bg-muted/30">
              <SheetTitle className="sr-only">Chat con {doctorName}</SheetTitle>
              <SheetDescription className="sr-only">
                Asistente virtual para responder tus preguntas
              </SheetDescription>
              {header}
            </SheetHeader>
            <ChatContent
              messages={messages}
              input={input}
              setInput={setInput}
              handleFormSubmit={handleFormSubmit}
              isLoading={isLoading}
              isThinking={isThinking}
              doctorName={doctorName}
              showSuggestions={showSuggestions}
              handleSuggestionClick={handleSuggestionClick}
              onSelectService={onSelectService}
              onSubmitPatientData={onSubmitPatientData}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
