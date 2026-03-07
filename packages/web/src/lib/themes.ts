/**
 * Theme Configuration for CitaBot
 *
 * Defines the available themes for public profile customization.
 * Colors use OKLCH format for consistency with the CSS system.
 */

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  preview: {
    gradient: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "default",
    name: "Violeta Tech",
    description: "Tema moderno con tonos violeta para un look profesional y tech",
    colors: {
      primary: "oklch(0.55 0.22 295)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.99 0.003 295)",
      foreground: "oklch(0.18 0.025 295)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.18 0.025 295)",
      secondary: "oklch(0.94 0.04 295)",
      secondaryForeground: "oklch(0.3 0.08 295)",
      muted: "oklch(0.96 0.008 295)",
      mutedForeground: "oklch(0.5 0.02 295)",
      accent: "oklch(0.82 0.1 295)",
      accentForeground: "oklch(0.25 0.08 295)",
      border: "oklch(0.9 0.025 295)",
      ring: "oklch(0.55 0.22 295)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.55 0.22 295), oklch(0.65 0.18 285))",
    },
  },
  {
    id: "ocean",
    name: "Oceano",
    description: "Tonos azules calmantes inspirados en el mar",
    colors: {
      primary: "oklch(0.65 0.15 230)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.98 0.01 230)",
      foreground: "oklch(0.25 0.02 230)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.02 230)",
      secondary: "oklch(0.92 0.03 230)",
      secondaryForeground: "oklch(0.3 0.08 230)",
      muted: "oklch(0.95 0.01 230)",
      mutedForeground: "oklch(0.5 0.02 230)",
      accent: "oklch(0.85 0.08 200)",
      accentForeground: "oklch(0.25 0.05 200)",
      border: "oklch(0.92 0.02 230)",
      ring: "oklch(0.65 0.15 230)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.65 0.15 230), oklch(0.75 0.12 200))",
    },
  },
  {
    id: "sunset",
    name: "Atardecer",
    description: "Tonos coral y melocoton calidos llenos de energia",
    colors: {
      primary: "oklch(0.65 0.18 30)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.98 0.02 30)",
      foreground: "oklch(0.25 0.03 30)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.03 30)",
      secondary: "oklch(0.92 0.05 30)",
      secondaryForeground: "oklch(0.35 0.08 30)",
      muted: "oklch(0.95 0.02 30)",
      mutedForeground: "oklch(0.5 0.03 30)",
      accent: "oklch(0.85 0.10 50)",
      accentForeground: "oklch(0.3 0.06 50)",
      border: "oklch(0.92 0.03 30)",
      ring: "oklch(0.65 0.18 30)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.65 0.18 30), oklch(0.75 0.15 50))",
    },
  },
  {
    id: "lavender",
    name: "Lavanda",
    description: "Purpura suave para un look elegante y relajado",
    colors: {
      primary: "oklch(0.60 0.15 290)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.98 0.01 290)",
      foreground: "oklch(0.25 0.02 290)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.02 290)",
      secondary: "oklch(0.92 0.04 290)",
      secondaryForeground: "oklch(0.35 0.08 290)",
      muted: "oklch(0.95 0.01 290)",
      mutedForeground: "oklch(0.5 0.02 290)",
      accent: "oklch(0.80 0.10 310)",
      accentForeground: "oklch(0.3 0.06 310)",
      border: "oklch(0.92 0.02 290)",
      ring: "oklch(0.60 0.15 290)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.60 0.15 290), oklch(0.70 0.12 310))",
    },
  },
  {
    id: "rose",
    name: "Rosa",
    description: "Tonos rosados perfectos para belleza y estetica",
    colors: {
      primary: "oklch(0.65 0.18 355)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.99 0.01 355)",
      foreground: "oklch(0.25 0.02 355)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.02 355)",
      secondary: "oklch(0.95 0.03 355)",
      secondaryForeground: "oklch(0.35 0.06 355)",
      muted: "oklch(0.96 0.01 355)",
      mutedForeground: "oklch(0.5 0.02 355)",
      accent: "oklch(0.85 0.08 10)",
      accentForeground: "oklch(0.25 0.05 10)",
      border: "oklch(0.92 0.02 355)",
      ring: "oklch(0.65 0.18 355)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.65 0.18 355), oklch(0.75 0.15 10))",
    },
  },
];

export const DEFAULT_THEME_ID = "default";

export function getThemeById(id: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getDefaultTheme(): ThemeDefinition {
  return THEMES[0];
}

/**
 * Converts theme colors to CSS custom properties object
 */
export function themeToCssVars(theme: ThemeDefinition): Record<string, string> {
  return {
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
  };
}
