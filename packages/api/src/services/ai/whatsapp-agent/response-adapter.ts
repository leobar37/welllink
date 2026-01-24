/**
 * Adapter to convert structured AI responses to plain text for WhatsApp
 */

export interface StructuredPart {
  type: string;
  [key: string]: unknown;
}

export interface WhatsAppResponse {
  text: string;
  shouldTransferToWeb?: boolean;
  transferUrl?: string;
}

// Maximum message length for WhatsApp (with some buffer)
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Convert structured response parts to plain text for WhatsApp
 */
export function adaptResponseToWhatsApp(
  parts: StructuredPart[],
  maxLength = MAX_MESSAGE_LENGTH,
): WhatsAppResponse {
  let textContent = "";
  const serviceInfo: string[] = [];
  let shouldTransferToWeb = false;
  let transferUrl = "";

  for (const part of parts) {
    switch (part.type) {
      case "text":
        textContent += part.text + "\n\n";
        break;

      case "services-list":
        const services = part.services as Array<{
          id: string;
          name: string;
          description: string;
          price: string;
          duration: string;
        }>;

        textContent += `${part.title || "Nuestros Servicios"}\n\n`;

        for (const service of services.slice(0, 5)) {
          // Limit to 5 services
          const serviceText = `• ${service.name}: ${service.price} (${service.duration})`;
          serviceInfo.push(serviceText);
          textContent += serviceText + "\n";
        }

        if (services.length > 5) {
          textContent += `\n...y ${services.length - 5} servicios más.`;
        }
        textContent += "\n\n";
        break;

      case "availability":
        const slots = part.slots as Array<{
          id: string;
          startTime: string;
          available: number;
        }>;

        textContent += `📅 ${part.date}\n\n`;

        if (slots.length > 0) {
          for (const slot of slots.slice(0, 4)) {
            const time = new Date(slot.startTime).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            });
            textContent += `🕐 ${time} (${slot.available} disponible)\n`;
          }
          textContent +=
            "\nPara agendar, te recomiendo continuar en nuestro chat web donde podrás completar el proceso fácilmente.\n\n";
          shouldTransferToWeb = true;
        } else {
          textContent +=
            "No hay disponibilidad para esta fecha. Te sugiero continuar en nuestro chat web para explorar otras opciones.\n\n";
          shouldTransferToWeb = true;
        }
        break;

      case "reservation":
        const reservation = part.reservation as {
          id: string;
          serviceName: string;
          date: string;
          time: string;
          patientName: string;
          status: string;
        };

        textContent += `✅ ${part.message || "Reserva solicitada"}\n\n`;
        textContent += `📋 Servicio: ${reservation.serviceName}\n`;
        textContent += `📅 Fecha: ${reservation.date}\n`;
        textContent += `🕐 Hora: ${reservation.time}\n`;
        textContent += `👤 Paciente: ${reservation.patientName}\n`;
        textContent += `Estado: ${reservation.status}\n\n`;
        break;

      case "faq":
        const faqs = part.faqs as Array<{ question: string; answer: string }>;

        textContent += `${part.title || "Preguntas Frecuentes"}\n\n`;

        for (const faq of faqs.slice(0, 4)) {
          textContent += `❓ ${faq.question}\n`;
          textContent += `💡 ${faq.answer}\n\n`;
        }
        break;

      case "calendar":
        textContent += `${part.title || "Seleccionar Fecha"}\n\n`;
        textContent += `Para seleccionar una fecha y ver disponibilidad, te recomiendo continuar en nuestro chat web interactivo.\n\n`;
        shouldTransferToWeb = true;
        break;

      case "patient-form":
        textContent += `${part.title || "Datos del Paciente"}\n\n`;
        textContent += `Para continuar con tu reservación, necesito que completes un formulario con tus datos.\n\n`;
        textContent += `Te recomiendo hacerlo en nuestro chat web donde será más fácil y rápido.\n\n`;
        shouldTransferToWeb = true;
        break;

      case "confirmation":
        textContent += `${part.title || "¿Confirmas?"}\n\n`;
        textContent += `${part.message}\n\n`;
        textContent += `Para confirmar, te recomiendo continuar en nuestro chat web.\n\n`;
        shouldTransferToWeb = true;
        break;

      default:
        // Skip unknown types but try to extract text if possible
        if (part.text) {
          textContent += part.text + "\n\n";
        }
    }
  }

  // Truncate if too long
  if (textContent.length > maxLength) {
    textContent =
      textContent.substring(0, maxLength - 100) +
      "\n\n...[mensaje truncado para adaptarse a WhatsApp]\n\n" +
      "Para continuar con más detalle, te recomiendo visitar nuestro chat web.";
    shouldTransferToWeb = true;
  }

  // Clean up extra whitespace
  textContent = textContent.replace(/\n{3,}/g, "\n\n").trim();

  return {
    text:
      textContent ||
      "Gracias por tu mensaje. Para atenderte mejor, te recomiendo continuar en nuestro chat web.",
    shouldTransferToWeb,
    transferUrl,
  };
}

/**
 * Extract structured parts from AI response text
 */
export function extractStructuredParts(text: string): StructuredPart[] {
  const parts: StructuredPart[] = [];

  // Pattern to match JSON blocks
  const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = jsonBlockPattern.exec(text)) !== null) {
    try {
      const jsonContent = JSON.parse(match[1]);
      if (jsonContent.parts && Array.isArray(jsonContent.parts)) {
        parts.push(...jsonContent.parts);
      } else if (jsonContent.type) {
        parts.push(jsonContent);
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return parts;
}

/**
 * Convert plain AI response to WhatsApp format
 */
export function convertToWhatsAppResponse(
  aiResponse: string,
): WhatsAppResponse {
  // Try to extract structured parts first
  const structuredParts = extractStructuredParts(aiResponse);

  if (structuredParts.length > 0) {
    return adaptResponseToWhatsApp(structuredParts);
  }

  // If no structured parts, use plain text
  let text = aiResponse;

  // Clean up markdown formatting for WhatsApp
  text = text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/\n{3,}/g, "\n\n") // Normalize whitespace
    .trim();

  // Truncate if too long
  if (text.length > MAX_MESSAGE_LENGTH) {
    text =
      text.substring(0, MAX_MESSAGE_LENGTH - 100) +
      "\n\n...[continúa en mensaje siguiente]\n\n" +
      "Para ver la respuesta completa, te recomiendo continuar en nuestro chat web.";
  }

  return { text };
}
