export const FEATURES = {
  HEALTH_SURVEY: {
    id: "health-survey",
    name: "Encuesta de Salud",
    description: "Test de Transformación 7 días",
    defaultButtonLabel: "Evalúate gratis",
    icon: "clipboard-check",
  },
} as const;

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES]["id"];
