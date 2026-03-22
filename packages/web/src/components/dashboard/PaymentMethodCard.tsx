import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/types";

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
  index: number;
  totalMethods: number;
  canDelete: boolean;
  isDeleting: boolean;
  isToggling?: boolean;
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
  index,
  totalMethods,
  canDelete,
  isDeleting,
  isToggling,
  onToggle,
  onMove,
  onDelete,
}: PaymentMethodCardProps) {
  const typeConfig = typeLabels[type as PaymentMethodType];
  const TypeIcon = typeConfig?.icon;

  return (
    <Card
      className={cn(
        "p-3 transition-all hover:border-border/80",
        !isActive && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "shrink-0 p-2 rounded-md",
            isActive ? "bg-primary/10" : "bg-muted/50",
          )}
        >
          {TypeIcon && (
            <TypeIcon
              className={cn(
                "h-4 w-4",
                isActive ? typeConfig?.color : "text-muted-foreground",
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{name}</p>
            {isActive && (
              <span className="text-xs text-muted-foreground">
                {typeConfig?.label}
              </span>
            )}
          </div>
          {instructions && isActive && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {instructions}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => onToggle(id, checked)}
              className="data-[state=checked]:bg-primary"
            />
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={index === 0}
              onClick={() => onMove(index, "up")}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Subir
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={index === totalMethods - 1}
              onClick={() => onMove(index, "down")}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Bajar
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
