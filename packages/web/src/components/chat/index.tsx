import { useState, useCallback } from "react";
import { ChatButton } from "./chat-button";
import { ChatDrawer } from "./chat-drawer";
import { ChatErrorBoundary } from "./chat-error-boundary";
import { ChatSidebar } from "./chat-sidebar";
import { ChatProvider, useChat } from "./chat-context";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatWidgetProps {
  profileId: string;
  doctorName: string;
}

function ChatWidgetInner({ doctorName }: { doctorName: string }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { input, sendMessage, status } = useChat();

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (input.trim()) {
        await sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  return (
    <>
      {isMobile && (
        <ChatButton
          isOpen={isOpen}
          onClick={isOpen ? handleClose : handleOpen}
          unreadCount={unreadCount}
        />
      )}

      {isMobile ? (
        <ChatDrawer
          isOpen={isOpen}
          onClose={handleClose}
          handleSubmit={handleSubmit}
          status={status}
          doctorName={doctorName}
        />
      ) : (
        <div className="h-full w-full">
          <ChatSidebar
            isOpen={isOpen}
            collapsed={collapsed}
            onCollapse={setCollapsed}
            handleSubmit={handleSubmit}
            status={status}
            doctorName={doctorName}
          />
        </div>
      )}
    </>
  );
}

export function ChatWidget({ profileId, doctorName }: ChatWidgetProps) {
  return (
    <ChatErrorBoundary>
      <ChatProvider profileId={profileId}>
        <ChatWidgetInner doctorName={doctorName} />
      </ChatProvider>
    </ChatErrorBoundary>
  );
}
