// =============================================================================
// Feature Flags
// =============================================================================

// Health Survey feature: REMOVED - legacy wellness feature
// export const FEATURES = {
//   HEALTH_SURVEY: {
//     id: "health-survey",
//     name: "Encuesta de Salud",
//     description: "Test de Transformación 7 días",
//     defaultButtonLabel: "Evalúate gratis",
//     icon: "clipboard-check",
//   },
// } as const;

// =============================================================================
// Feature System
// =============================================================================

export interface FeatureConfig {
  id: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export const FEATURES_CONFIG = {
  // Feature flags can be enabled/disabled per profile
  healthSurvey: {
    enabled: false, // Feature disabled
  },
} as const;

export type FeatureKey = keyof typeof FEATURES_CONFIG;
