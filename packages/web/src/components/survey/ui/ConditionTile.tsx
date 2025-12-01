import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConditionTileProps {
  condition: string
  isSelected: boolean
  onToggle: () => void
}

export function ConditionTile({
  condition,
  isSelected,
  onToggle,
}: ConditionTileProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onToggle}
      className={cn(
        "w-full min-h-[52px] p-4 rounded-lg border text-left transition-all",
        "hover:border-primary/50 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "bg-primary/10 border-primary text-foreground"
          : "bg-card border-border hover:bg-accent/50"
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded border transition-colors",
            isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/50"
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
        </span>
        <span className="text-sm font-medium">{condition}</span>
      </span>
    </button>
  )
}
