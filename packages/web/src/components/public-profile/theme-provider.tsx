import { useMemo, useState, createContext, useContext, useCallback } from "react";
import {
  getThemeById,
  getDefaultTheme,
  themeToCssVars,
} from "@/lib/themes";

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
 * Also exposes a container ref via context for portals (modals, dialogs)
 * to render inside the themed container.
 */
export function ProfileThemeProvider({
  themeId,
  children,
}: ProfileThemeProviderProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const cssVars = useMemo(() => {
    const theme = getThemeById(themeId ?? "") ?? getDefaultTheme();
    return themeToCssVars(theme);
  }, [themeId]);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainer(node);
    }
  }, []);

  return (
    <div
      ref={refCallback}
      style={cssVars as React.CSSProperties}
      className="min-h-screen"
    >
      <ThemeContainerContext.Provider value={container}>
        {children}
      </ThemeContainerContext.Provider>
    </div>
  );
}
