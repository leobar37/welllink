import { createTool } from "@voltagent/core";
import { z } from "zod";

/**
 * Input schema for FAQ search
 */
const SearchFAQInput = z.object({
  query: z.string().describe("The question or topic to search for in the FAQ"),
});

/**
 * Common FAQ responses for medical practice
 * These are general templates that can be customized per profile
 */
const commonFAQ = [
  {
    keywords: ["horario", "horarios", "atienden", "abren", "cerrado"],
    question: "¿Cuáles son los horarios de atención?",
    answer:
      "Nuestros horarios de atención son de Lunes a Viernes de 9:00 a 18:00 y Sábados de 9:00 a 13:00. Puedes agendar citas en cualquier momento a través de este chat y te confirmaremos la disponibilidad.",
  },
  {
    keywords: ["precio", "costo", "cuánto", "cuanto cuesta", "tarifa"],
    question: "¿Cuánto cuesta una consulta?",
    answer:
      "Los precios varían según el tipo de servicio. Para conocer el precio exacto de la consulta o procedimiento que necesitas, puedo mostrarte nuestra lista de servicios. ¿Te gustaría ver los precios?",
  },
  {
    keywords: ["ubicación", "dirección", "donde", "cómo llegar", "maps"],
    question: "¿Dónde están ubicados?",
    answer:
      "Para conocer nuestra ubicación exacta y cómo llegar, puedo enviarte la dirección. También puedes encontrar un enlace a Google Maps en nuestro perfil público.",
  },
  {
    keywords: ["cancelar", "reagendar", "cambiar", "reprogramar"],
    question: "¿Cómo cancelo o reprogramo mi cita?",
    answer:
      "Para cancelar o reprogramar una cita, responde a este chat con tu nombre y la fecha de la cita. Te ayudaremos a reprogramar o cancelar sin costo adicional (con al menos 24 horas de anticipación).",
  },
  {
    keywords: ["seguro", "aseguradora", "seguro médico", "isr", "afirma"],
    question: "¿Aceptan seguros médicos?",
    answer:
      "Aceptamos diversos seguros médicos. Te recomendamos traer tu identificación y póliza el día de tu cita para verificar la cobertura. Algunos procedimientos pueden tener copago o deducible.",
  },
  {
    keywords: ["documentos", "llevar", "requieren", "necesito"],
    question: "¿Qué documentos debo llevar a mi cita?",
    answer:
      "Para tu primera visita, bring tu identificación (INE o Pasaporte), información de tu seguro médico (si aplica), y cualquier estudio o análisis previo que tengas. Si es para un menor de edad, bring identificación del tutor.",
  },
  {
    keywords: ["urgencia", "emergencia", "dolor", "urgente"],
    question: "¿Tienen servicio de urgencias?",
    answer:
      "Para emergencias médicas, te recomendamos acudir al servicio de urgencias más cercano o llamar a emergencias (911). Este chat es para citas programadas e información general. ¿Te gustaría agendar una cita de urgencia?",
  },
  {
    keywords: ["whatsapp", "contacto", "teléfono", "llamar"],
    question: "¿Cómo puedo contactarlos directamente?",
    answer:
      "Puedes contactarnos directamente por WhatsApp a este mismo número. También puedes ver nuestros otros canales de contacto en nuestro perfil público.",
  },
];

/**
 * Tool to search and answer frequently asked questions
 */
export const searchFAQTool = createTool({
  name: "search_faq",
  description:
    "Answer frequently asked questions about the medical practice. Use this for general questions about services, prices, location, hours, and policies. For medical questions, always recommend visiting for a consultation.",
  parameters: SearchFAQInput,
  execute: async ({ query }) => {
    const lowerQuery = query.toLowerCase();

    // Find matching FAQ based on keywords
    const match = commonFAQ.find((faq) =>
      faq.keywords.some((keyword) => lowerQuery.includes(keyword)),
    );

    if (match) {
      return {
        success: true,
        question: match.question,
        answer: match.answer,
      };
    }

    // Default response for unmatched queries
    return {
      success: false,
      message:
        "No tengo una respuesta específica para esa pregunta. Te recomiendo agendar una consulta para que podamos atenderte mejor. ¿Te gustaría ver nuestros horarios disponibles?",
    };
  },
});
