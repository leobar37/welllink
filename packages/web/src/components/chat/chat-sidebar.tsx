import { useState, useCallback, useEffect } from "react";
import { Bot, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatContent } from "./chat-content";
import { cn } from "@/lib/utils";
import { useChat } from "./chat-context";

interface ChatSidebarProps {
  isOpen: boolean;
  onCollapse?: (collapsed: boolean) => void;
  collapsed?: boolean;
  handleSubmit: (event: React.FormEvent) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  doctorName: string;
}

export function ChatSidebar({
  isOpen,
  onCollapse,
  collapsed: externalCollapsed,
  handleSubmit,
  status,
  doctorName,
}: ChatSidebarProps) {
  const { input, setInput } = useChat();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed ?? internalCollapsed;
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (onCollapse) {
      onCollapse(collapsed);
    }
  }, [collapsed, onCollapse]);

  const isThinking = status === "submitted" || status === "streaming";
  const isLoading = status === "submitted" || status === "streaming";

  const handleCollapse = useCallback(() => {
    if (externalCollapsed !== undefined) {
      onCollapse?.(!collapsed);
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [collapsed, externalCollapsed, onCollapse]);

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

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm ring-1 ring-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">
            Asistente de {doctorName}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isThinking ? "bg-amber-500 animate-pulse" : "bg-emerald-500",
              )}
            />
            {isThinking ? "Escribiendo..." : "En línea"}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className="h-8 w-8 rounded-lg hover:bg-muted/80 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {collapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-background/95 backdrop-blur-sm border-l shadow-2xl",
        collapsed ? "w-12 min-w-[48px]" : "w-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
        {!collapsed && header}
        {collapsed && (
          <div className="w-full flex flex-col items-center gap-3 py-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapse}
              className="h-10 w-10 rounded-xl hover:bg-muted/80 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapse}
              className="h-8 w-8 rounded-lg hover:bg-muted/80 transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <ChatContent
          handleFormSubmit={handleFormSubmit}
          isLoading={isLoading}
          isThinking={isThinking}
          doctorName={doctorName}
          showSuggestions={showSuggestions}
          handleSuggestionClick={handleSuggestionClick}
        />
      )}
    </div>
  );
}
