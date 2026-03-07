import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/types";
import { semanticColors } from "@/lib/colors";

interface TypeLabelConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

interface PaymentMethodCardProps {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  isActive: boolean;
  typeLabels: Record<PaymentMethodType, TypeLabelConfig>;
  editMode: "toggle" | "edit";
  isSelected: boolean;
  index: number;
  totalMethods: number;
  canDelete: boolean;
  isDeleting: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
}

export function PaymentMethodCard({
  id,
  name,
  type,
  instructions,
  isActive,
  typeLabels,
  editMode,
  isSelected,
  index,
  totalMethods,
  canDelete,
  isDeleting,
  onToggle,
  onMove,
  onDelete,
}: PaymentMethodCardProps) {
  const typeConfig = typeLabels[type as PaymentMethodType];
  const TypeIcon = typeConfig?.icon;
  const typeColor = typeConfig?.color || semanticColors.labels.muted.text;
  const typeBgColor = typeConfig?.color
    ? `${typeConfig.color}/10`
    : semanticColors.labels.muted.bg;

  return (
    <Card
      className={cn(
        "p-4 transition-all",
        isSelected &&
          cn(
            semanticColors.border.selected,
            semanticColors.background.selected,
          ),
        !isActive && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox for selection mode */}
        {editMode === "toggle" && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggle(id, checked === true)}
            className="h-5 w-5"
          />
        )}

        {/* Icon */}
        <div className={cn("shrink-0 p-2 rounded-md", typeBgColor)}>
          {TypeIcon && <TypeIcon className={cn("h-5 w-5", typeColor)} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{name}</p>
            {isActive && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  semanticColors.status.success.bg,
                  semanticColors.status.success.text,
                )}
              >
                Activo
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {typeConfig?.label || type}
          </p>
          {instructions && (
            <p className="text-sm text-muted-foreground mt-1">{instructions}</p>
          )}
        </div>

        {/* Actions (only in edit mode) */}
        {editMode === "edit" && (
          <div className="shrink-0 flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => onMove(index, "up")}
              title="Mover arriba"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={index === totalMethods - 1}
              onClick={() => onMove(index, "down")}
              title="Mover abajo"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(id)}
                disabled={isDeleting}
                title="Eliminar"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
