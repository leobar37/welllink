import type { NewCampaignTemplate } from "../db/schema/campaign-template";

export interface DefaultCampaignTemplate {
  name: string;
  content: string;
  objective: string;
  variables: string[];
}

export const DEFAULT_CAMPAIGN_TEMPLATES: DefaultCampaignTemplate[] = [
  {
    name: "Bienvenida Nuevo Cliente",
    content:
      "¡Hola {nombre}! 👋\n\nBienvenido/a a nuestro servicio. Estamos muy felices de tenerte con nosotros.\n\n¿En qué podemos ayudarte hoy?",
    objective: "Bienvenida",
    variables: ["nombre"],
  },
  {
    name: "Recordatorio de Cita",
    content:
      "¡Hola {nombre}! 📅\n\nTe recordamos que tienes una cita programada para mañana a las {hora}.\n\n¿Necesitas algo especial para tu cita?",
    objective: "Recordatorio",
    variables: ["nombre", "hora"],
  },
  {
    name: "Seguimiento Post-Servicio",
    content:
      "¡Hola {nombre}! 🙏\n\nGracias por visitarnos. ¿Cómo te fue con el servicio?\n\nSi tienes alguna duda, no dudes en contactarnos.",
    objective: "Seguimiento",
    variables: ["nombre"],
  },
  {
    name: "Promoción Especial",
    content:
      "¡Hola {nombre}! 🎉\n\nTenemos una oferta especial para ti:\n\n{oferta}\n\nVálido hasta el {fecha}.\n\n¿Te interesa?",
    objective: "Promoción",
    variables: ["nombre", "oferta", "fecha"],
  },
  {
    name: "Felicitaciones de Cumpleaños",
    content:
      "¡Feliz cumpleaños {nombre}! 🎂\n\nEn nombre de todo nuestro equipo, queremos desearte un día maravilloso lleno de alegría y salud.\n\n¡Celebra con nosotros!",
    objective: "Felicitaciones",
    variables: ["nombre"],
  },
  {
    name: "Reactivación de Cliente",
    content:
      "¡Hola {nombre}! 👋\n\nHemos pensado en ti. ¿Todo bien?\n\nTenemos muchas cosas nuevas que queremos mostrarte.\n\n¿Cuando podrías visitarnos?",
    objective: "Reactivación",
    variables: ["nombre"],
  },
  {
    name: "Recordatorio de Renovación",
    content:
      "¡Hola {nombre}! ⏰\n\nTu servicio vence el {fecha}.\n\n¿Deseas renovar? Tenemos planes especiales para ti.",
    objective: "Renovación",
    variables: ["nombre", "fecha"],
  },
  {
    name: "Encuesta de Satisfacción",
    content:
      "¡Hola {nombre}! 📝\n\nNos gustaría conocer tu opinión sobre tu última experiencia con nosotros.\n\n{tipo}\n\nTu retroalimentación nos ayuda a mejorar.",
    objective: "Feedback",
    variables: ["nombre", "tipo"],
  },
];

export function getDefaultTemplates(profileId: string): NewCampaignTemplate[] {
  return DEFAULT_CAMPAIGN_TEMPLATES.map((template) => ({
    profileId,
    name: template.name,
    content: template.content,
    objective: template.objective,
    variables: template.variables,
    usageCount: 0,
  }));
}
