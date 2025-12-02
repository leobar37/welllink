import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeDefinition } from "@/lib/themes";

interface ThemeCardProps {
  theme: ThemeDefinition;
  isSelected: boolean;
  onSelect: (themeId: string) => void;
}

export function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Theme preview gradient */}
      <div
        className="mb-3 h-16 w-full rounded-lg"
        style={{ background: theme.preview.gradient }}
      />

      {/* Color dots */}
      <div className="mb-3 flex gap-1.5">
        <div
          className="h-4 w-4 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary"
        />
        <div
          className="h-4 w-4 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.background }}
          title="Background"
        />
        <div
          className="h-4 w-4 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent"
        />
      </div>

      {/* Theme info */}
      <h3 className="font-medium text-foreground">{theme.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {theme.description}
      </p>
    </button>
  );
}
