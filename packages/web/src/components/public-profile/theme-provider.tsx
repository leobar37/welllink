import { useMemo } from "react";
import {
  getThemeById,
  getDefaultTheme,
  themeToCssVars,
} from "@/lib/themes";

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
 */
export function ProfileThemeProvider({
  themeId,
  children,
}: ProfileThemeProviderProps) {
  const cssVars = useMemo(() => {
    const theme = getThemeById(themeId ?? "") ?? getDefaultTheme();
    return themeToCssVars(theme);
  }, [themeId]);

  return (
    <div style={cssVars as React.CSSProperties} className="contents">
      {children}
    </div>
  );
}
