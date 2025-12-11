import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Paintbrush } from "lucide-react"
import { cn } from "@/lib/utils"
import { THEMES, DEFAULT_THEME_ID, type ThemeDefinition } from "@/lib/themes"

// Compact theme card component for onboarding
function CompactThemeCard({
  theme,
  isSelected,
  onSelect
}: {
  theme: ThemeDefinition
  isSelected: boolean
  onSelect: (themeId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={cn(
        "relative flex flex-col rounded-lg border-2 p-3 text-left transition-all",
        "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Theme preview gradient */}
      <div
        className="mb-2 h-12 w-full rounded-md"
        style={{ background: theme.preview.gradient }}
      />

      {/* Color dots */}
      <div className="mb-2 flex gap-1">
        <div
          className="h-3 w-3 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary"
        />
        <div
          className="h-3 w-3 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.background }}
          title="Background"
        />
        <div
          className="h-3 w-3 rounded-full border border-border/50"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent"
        />
      </div>

      {/* Theme info */}
      <h3 className="text-sm font-medium text-foreground">{theme.name}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
        {theme.description}
      </p>
    </button>
  )
}

export function StepTheme({ onNext, isLoading }: { onNext: (data: { theme: string }) => void; isLoading?: boolean }) {
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME_ID)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personaliza tu Estilo</CardTitle>
        <CardDescription>
          Elige un tema que refleje tu personalidad y estilo único.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 grid-cols-3">
          {THEMES.map((theme) => (
            <CompactThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onSelect={setSelectedTheme}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onNext({ theme: selectedTheme })}
          className="w-full"
          disabled={isLoading}
        >
          Continuar con tema {THEMES.find(t => t.id === selectedTheme)?.name}
        </Button>
      </CardFooter>
    </Card>
  )
}
