import { createTool } from "@voltagent/core";
import { z } from "zod";

const QuickFaqInput = z.object({
  question: z.string().describe("Pregunta del usuario"),
  category: z
    .enum([
      "horarios",
      "precios",
      "ubicacion",
      "servicios",
      "contacto",
      "general",
    ])
    .describe("Categoría de la consulta"),
});

const quickFAQResponses: Record<
  string,
  { keywords: string[]; answer: string }
> = {
  horarios: {
    keywords: [
      "horario",
      "horarios",
      "atienden",
      "abren",
      "cerrado",
      "disponible",
    ],
    answer:
      "Nuestros horarios son Lunes a Viernes 9:00-18:00 y Sábados 9:00-13:00. ¿Te gustaría agendar una cita?",
  },
  precios: {
    keywords: ["precio", "costo", "cuánto", "cuanto cuesta", "tarifa", "valor"],
    answer:
      "Los precios varían según el servicio. Puedo mostrarte nuestra lista de servicios con precios. ¿Te gustaría verla?",
  },
  ubicacion: {
    keywords: [
      "ubicación",
      "dirección",
      "donde",
      "cómo llegar",
      "maps",
      "localización",
    ],
    answer:
      "Nuestra dirección y enlace a Google Maps están en nuestro perfil público. ¿Te los envío?",
  },
  servicios: {
    keywords: [
      "servicio",
      "servicios",
      "qué ofrecen",
      "especialidades",
      "hacen",
    ],
    answer:
      "Ofrecemos consultas generales, especialidades y más. ¿Te gustaría ver nuestra lista completa de servicios?",
  },
  contacto: {
    keywords: ["whatsapp", "contacto", "teléfono", "llamar", "hablar"],
    answer:
      "Puedes escribirnos aquí mismo por WhatsApp. ¿En qué puedo ayudarte hoy?",
  },
  general: {
    keywords: ["hola", "buenos días", "tardes", "noches", "saludo"],
    answer:
      "¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre horarios, precios, ubicación o agendar una cita.",
  },
};

export const quickFaqTool = createTool({
  name: "quick_faq",
  description:
    "Responder preguntas frecuentes de forma rápida y concisa para WhatsApp. SOLO para consultas simples como horarios, precios, ubicación, información general. Si requiere agendar cita, ver disponibilidad o información personalizada, usar 'suggest_transfer'.",
  parameters: QuickFaqInput,
  execute: async ({ question, category }) => {
    const faq = quickFAQResponses[category];

    if (!faq) {
      return {
        action: "suggest_transfer",
        reason: "Categoría no reconocida",
        suggestedMessage:
          "Para esto es mejor que conversemos directamente. Te paso a nuestro chat donde podrás agendar tu cita con calma.",
        shouldTransfer: true,
      };
    }

    return {
      action: "answer",
      answer: faq.answer,
      category,
      shouldTransfer: false,
    };
  },
});
