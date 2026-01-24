import { memo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { ConfirmationAIPart, AIUIHandlers } from "./types";

interface ConfirmationPartProps {
  part: ConfirmationAIPart;
  handlers: AIUIHandlers;
}

export const ConfirmationPart = memo(
  ({ part, handlers }: ConfirmationPartProps) => {
    return (
      <div className="space-y-4 my-4">
        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <AlertTriangle className="w-5 h-5 text-foreground mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-sm">{part.title}</p>
            <p className="text-sm text-muted-foreground">{part.message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handlers.onConfirm?.(part.data)}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {part.confirmLabel || "Confirmar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlers.onCancel?.()}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-1" />
            {part.cancelLabel || "Cancelar"}
          </Button>
        </div>
      </div>
    );
  },
);

ConfirmationPart.displayName = "ConfirmationPart";

export default ConfirmationPart;
