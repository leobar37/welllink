import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectableCardProps {
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

export function SelectableCard({
  children,
  isSelected,
  onSelect,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-lg border p-4 text-left transition-all w-full",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        className,
      )}
    >
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
      {children}
    </button>
  );
}
