import { useTheme, type ThemeName } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import {
  Heart,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes: { id: ThemeName; label: string; icon: typeof Heart }[] = [
  { id: "medical", label: "Médico", icon: Heart },
  { id: "wellness", label: "Wellness", icon: Sparkles },
  { id: "minimal", label: "Minimal", icon: Moon },
];

export function ThemeSelector() {
  const { theme, setTheme, isDark, toggleDark } = useTheme();

  const currentTheme = themes.find((t) => t.id === theme);
  const CurrentIcon = currentTheme?.icon || Heart;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "text-sm font-medium transition-colors",
            "hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          aria-label="Seleccionar tema"
        >
          <CurrentIcon className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline text-muted-foreground">
            {currentTheme?.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Apariencia
        </div>
        <DropdownMenuItem
          onClick={toggleDark}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              <span>Modo claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span>Modo oscuro</span>
            </>
          )}
        </DropdownMenuItem>
        <div className="my-1 border-t border-border" />
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Tema de color
        </div>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === t.id && "bg-secondary"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
