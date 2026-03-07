/**
 * Semantic color utilities for consistent theming
 * Use these instead of hardcoded Tailwind colors (gray, blue, green, etc.)
 */

export const semanticColors = {
  /** Status colors for success, warning, error, info states */
  status: {
    success: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/30",
      icon: "text-primary",
    },
    warning: {
      bg: "bg-accent/30",
      text: "text-accent-foreground",
      border: "border-accent/40",
      icon: "text-accent-foreground",
    },
    error: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/30",
      icon: "text-destructive",
    },
    info: {
      bg: "bg-secondary",
      text: "text-secondary-foreground",
      border: "border-secondary-foreground/20",
      icon: "text-secondary-foreground",
    },
  },

  /** Label colors for categorization (replaces blue, emerald, amber) */
  labels: {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: "bg-primary/20 text-primary",
    },
    secondary: {
      bg: "bg-secondary",
      text: "text-secondary-foreground",
      icon: "bg-secondary text-secondary-foreground",
    },
    muted: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      icon: "bg-muted text-muted-foreground",
    },
    accent: {
      bg: "bg-accent/30",
      text: "text-accent-foreground",
      icon: "bg-accent/50 text-accent-foreground",
    },
  },

  /** Background utilities */
  background: {
    subtle: "bg-muted/30",
    hover: "bg-accent/30",
    selected: "bg-primary/5",
    disabled: "bg-muted/50",
  },

  /** Border utilities */
  border: {
    default: "border-border/40",
    hover: "border-primary/30",
    selected: "border-primary/70",
    subtle: "border-border/30",
  },
} as const;

/** Type exports for TypeScript */
export type SemanticStatus = keyof typeof semanticColors.status;
export type SemanticLabel = keyof typeof semanticColors.labels;
