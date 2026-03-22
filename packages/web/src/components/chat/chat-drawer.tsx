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
import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatContent } from "./chat-content";
import { useChat } from "./chat-context";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  doctorName: string;
}

export function ChatDrawer({
  isOpen,
  onClose,
  handleSubmit,
  status,
  doctorName,
}: ChatDrawerProps) {
  const isMobile = useIsMobile();
  const { input, setInput } = useChat();
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (input.trim() && status !== "streaming") {
        handleSubmit(event);
        setShowSuggestions(false);
      }
    },
    [input, status, handleSubmit],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      setShowSuggestions(false);
    },
    [setInput],
  );

  const isThinking = status === "submitted" || status === "streaming";
  const isLoading = status === "submitted" || status === "streaming";

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
              handleFormSubmit={handleFormSubmit}
              isLoading={isLoading}
              isThinking={isThinking}
              doctorName={doctorName}
              showSuggestions={showSuggestions}
              handleSuggestionClick={handleSuggestionClick}
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
              handleFormSubmit={handleFormSubmit}
              isLoading={isLoading}
              isThinking={isThinking}
              doctorName={doctorName}
              showSuggestions={showSuggestions}
              handleSuggestionClick={handleSuggestionClick}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
