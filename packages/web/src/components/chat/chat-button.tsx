import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatButton({ isOpen, onClick, unreadCount = 0 }: ChatButtonProps) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.button
            key="close"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors duration-200",
            )}
            aria-label="Cerrar chat"
          >
            <X className="w-6 h-6" />
          </motion.button>
        ) : (
          <motion.button
            key="open"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors duration-200",
            )}
            aria-label="Abrir chat"
          >
            <MessageCircle className="w-6 h-6" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
