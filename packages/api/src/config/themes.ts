/**
 * Theme Configuration for Wellness Link
 *
 * Defines the available themes for public profile customization.
 * Colors use OKLCH format for consistency with the frontend CSS system.
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
    name: "Wellness Verde",
    description: "Tema predeterminado con tonos verdes relajantes",
    colors: {
      primary: "oklch(0.696 0.17 162.48)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.995 0 0)",
      foreground: "oklch(0.25 0.01 260)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.01 260)",
      secondary: "oklch(0.97 0.01 162)",
      secondaryForeground: "oklch(0.3 0.05 162)",
      muted: "oklch(0.97 0 0)",
      mutedForeground: "oklch(0.5 0 0)",
      accent: "oklch(0.96 0.02 162)",
      accentForeground: "oklch(0.3 0.05 162)",
      border: "oklch(0.94 0 0)",
      ring: "oklch(0.696 0.17 162.48)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.76 0.14 162))",
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
    description: "Purpura suave para relajacion y mindfulness",
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
    id: "earth",
    name: "Tierra",
    description: "Tonos naturales y organicos para bienestar holistico",
    colors: {
      primary: "oklch(0.55 0.10 70)",
      primaryForeground: "oklch(1 0 0)",
      background: "oklch(0.97 0.02 70)",
      foreground: "oklch(0.25 0.03 40)",
      card: "oklch(0.99 0.01 70)",
      cardForeground: "oklch(0.25 0.03 40)",
      secondary: "oklch(0.90 0.04 70)",
      secondaryForeground: "oklch(0.35 0.06 70)",
      muted: "oklch(0.93 0.02 70)",
      mutedForeground: "oklch(0.5 0.03 70)",
      accent: "oklch(0.75 0.08 90)",
      accentForeground: "oklch(0.3 0.05 90)",
      border: "oklch(0.90 0.03 70)",
      ring: "oklch(0.55 0.10 70)",
    },
    preview: {
      gradient:
        "linear-gradient(135deg, oklch(0.55 0.10 70), oklch(0.65 0.08 90))",
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

export function isValidThemeId(id: string): boolean {
  return THEMES.some((t) => t.id === id);
}
