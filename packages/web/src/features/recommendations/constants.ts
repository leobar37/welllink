import type { Section } from "./components/SectionNav";

// Predefined sections for Client Tab
export const CLIENT_SECTIONS: Section[] = [
  { id: "client-summary", label: "Resumen", icon: "📋" },
  { id: "client-metrics", label: "Métricas", icon: "📊" },
  { id: "client-health", label: "Salud", icon: "🩺" },
  { id: "client-nutrition", label: "Nutrición", icon: "🍎" },
  { id: "client-supplements", label: "Suplementos", icon: "💊" },
];

// Predefined sections for Advisor Tab
export const ADVISOR_SECTIONS: Section[] = [
  { id: "advisor-alerts", label: "Alertas", icon: "⚠️" },
  { id: "advisor-plan", label: "Plan", icon: "📅" },
  { id: "advisor-goals", label: "Metas", icon: "🎯" },
];
