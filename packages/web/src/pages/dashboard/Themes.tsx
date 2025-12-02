import { useState } from "react";
import { Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useThemeManager } from "@/hooks/use-themes";
import { ThemeCard } from "@/components/dashboard/theme-card";
import { ThemePreview } from "@/components/dashboard/theme-preview";

export function ThemesPage() {
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const {
    themes,
    currentThemeId,
    isLoadingCurrentTheme,
    updateTheme,
    isUpdating,
  } = useThemeManager(profile?.id);

  // Local state for preview before saving
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  // Use selected theme for preview, fallback to current
  const previewThemeId = selectedThemeId ?? currentThemeId;
  const hasChanges = selectedThemeId !== null && selectedThemeId !== currentThemeId;

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const handleSave = () => {
    if (selectedThemeId) {
      updateTheme(selectedThemeId, {
        onSuccess: () => {
          setSelectedThemeId(null);
        },
      });
    }
  };

  const handleCancel = () => {
    setSelectedThemeId(null);
  };

  if (isLoadingProfile || isLoadingCurrentTheme) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Temas</h1>
            <p className="text-sm text-muted-foreground">
              Personaliza la apariencia de tu perfil publico
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Selecciona un tema
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={previewThemeId === theme.id}
                onSelect={handleSelectTheme}
              />
            ))}
          </div>

          {/* Action buttons */}
          {hasChanges && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ThemePreview
              themeId={previewThemeId}
              profile={profile ? {
                displayName: profile.displayName,
                title: profile.title,
                bio: profile.bio,
                avatarUrl: null, // We don't have the resolved URL here
              } : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
