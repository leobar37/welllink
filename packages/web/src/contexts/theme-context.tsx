import { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "medical" | "wellness" | "minimal";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleDark: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "medical",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [isDark, setIsDark] = useState(false);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("welllink-theme", newTheme);
  };

  const toggleDark = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("welllink-dark", String(newIsDark));
  };

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("welllink-theme") as ThemeName | null;
    const savedDark = localStorage.getItem("welllink-dark");

    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", defaultTheme);
    }

    if (savedDark !== null) {
      const dark = savedDark === "true";
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, [defaultTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleDark, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
