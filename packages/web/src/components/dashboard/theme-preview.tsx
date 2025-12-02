import { useMemo } from "react";
import { Instagram, MessageCircle, Globe } from "lucide-react";
import { getThemeById, getDefaultTheme, themeToCssVars } from "@/lib/themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Profile {
  displayName: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

interface ThemePreviewProps {
  themeId: string;
  profile?: Profile | null;
}

export function ThemePreview({ themeId, profile }: ThemePreviewProps) {
  const cssVars = useMemo(() => {
    const theme = getThemeById(themeId) ?? getDefaultTheme();
    return themeToCssVars(theme);
  }, [themeId]);

  const displayName = profile?.displayName ?? "Tu Nombre";
  const title = profile?.title ?? "Asesor de Bienestar";
  const bio = profile?.bio ?? "Ayudando a transformar vidas con bienestar integral";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Vista previa
      </h3>

      {/* Phone frame */}
      <div className="relative w-[220px] overflow-hidden rounded-[24px] border-4 border-foreground/10 shadow-lg">
        {/* Screen content with theme variables */}
        <div
          style={cssVars as React.CSSProperties}
          className="min-h-[380px] p-4"
        >
          {/* Background layer */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--background)" }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center space-y-4 pt-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 border-2" style={{ borderColor: "var(--background)" }}>
              <AvatarImage src={profile?.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback
                className="text-sm font-medium"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name and title */}
            <div className="text-center">
              <h2
                className="text-base font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {displayName}
              </h2>
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {title}
              </p>
            </div>

            {/* Bio */}
            <p
              className="text-center text-xs line-clamp-2 px-2"
              style={{ color: "var(--foreground)" }}
            >
              {bio}
            </p>

            {/* Social links simulation */}
            <div className="flex gap-2">
              {[Instagram, MessageCircle, Globe].map((Icon, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div
              className="w-full h-px"
              style={{ backgroundColor: "var(--border)" }}
            />

            {/* Action button simulation */}
            <Button
              size="sm"
              className="w-full text-xs"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Evalua tu salud gratis
            </Button>
          </div>
        </div>

        {/* Phone notch */}
        <div className="absolute left-1/2 top-1 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground/10" />
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center max-w-[200px]">
        Asi se vera tu perfil publico con este tema
      </p>
    </div>
  );
}
