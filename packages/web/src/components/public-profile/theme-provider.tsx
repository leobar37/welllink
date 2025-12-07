import {
  useMemo,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { getThemeById, getDefaultTheme } from "@/lib/themes";

// Context to provide the theme container ref for portals
const ThemeContainerContext = createContext<HTMLDivElement | null>(null);

export function useThemeContainer() {
  return useContext(ThemeContainerContext);
}

interface ProfileThemeProviderProps {
  themeId: string | null | undefined;
  children: React.ReactNode;
}

/**
 * ProfileThemeProvider wraps the public profile content and injects
 * CSS custom properties based on the selected theme.
 *
 * This allows each public profile to have its own color scheme
 * without affecting the dashboard or other parts of the app.
 *
 * Uses inline styles to override :root variables with highest specificity.
 *
 * Also exposes a container ref via context for portals (modals, dialogs)
 * to render inside the themed container.
 */
export function ProfileThemeProvider({
  themeId,
  children,
}: ProfileThemeProviderProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const theme = useMemo(() => {
    return getThemeById(themeId ?? "") ?? getDefaultTheme();
  }, [themeId]);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainer(node);
    }
  }, []);

  // Build inline style object with CSS variables
  const themeStyles = useMemo(
    () =>
      ({
        "--primary": theme.colors.primary,
        "--primary-foreground": theme.colors.primaryForeground,
        "--background": theme.colors.background,
        "--foreground": theme.colors.foreground,
        "--card": theme.colors.card,
        "--card-foreground": theme.colors.cardForeground,
        "--secondary": theme.colors.secondary,
        "--secondary-foreground": theme.colors.secondaryForeground,
        "--muted": theme.colors.muted,
        "--muted-foreground": theme.colors.mutedForeground,
        "--accent": theme.colors.accent,
        "--accent-foreground": theme.colors.accentForeground,
        "--border": theme.colors.border,
        "--ring": theme.colors.ring,
        // Also set the Tailwind v4 color variables directly
        "--color-background": theme.colors.background,
        "--color-foreground": theme.colors.foreground,
        "--color-card": theme.colors.card,
        "--color-card-foreground": theme.colors.cardForeground,
        "--color-primary": theme.colors.primary,
        "--color-primary-foreground": theme.colors.primaryForeground,
        "--color-secondary": theme.colors.secondary,
        "--color-secondary-foreground": theme.colors.secondaryForeground,
        "--color-muted": theme.colors.muted,
        "--color-muted-foreground": theme.colors.mutedForeground,
        "--color-accent": theme.colors.accent,
        "--color-accent-foreground": theme.colors.accentForeground,
        "--color-border": theme.colors.border,
        "--color-ring": theme.colors.ring,
        // Set background color directly for the container
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
      }) as React.CSSProperties,
    [theme],
  );

  return (
    <div
      ref={refCallback}
      data-profile-theme={theme.id}
      style={themeStyles}
      className="min-h-screen flex flex-col"
    >
      <ThemeContainerContext.Provider value={container}>
        {children}
      </ThemeContainerContext.Provider>
    </div>
  );
}
