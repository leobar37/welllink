import type { AIMessagePart } from "../../chat/schema";
import { extractStructuredParts } from "../../chat/parser";
import type { MessageStrategy } from "../message-strategy.interface";
import type { ChannelType, FormattedMessage } from "../types";

/**
 * Estrategia de formateo para WhatsApp.
 *
 * Convierte las respuestas estructuradas del agente IA a texto plano
 * que puede ser enviado via Evolution API.
 *
 * Características:
 * - Convierte componentes interactivos a texto descriptivo
 * - Limita mensajes a 4096 caracteres (límite de WhatsApp)
 * - Usa emojis moderados para mejorar legibilidad
 * - Formato simple sin markdown complejo
 */
export class WhatsAppMessageStrategy implements MessageStrategy {
  readonly channel: ChannelType = "whatsapp";

  /** Límite de caracteres para mensajes de WhatsApp */
  private readonly MAX_LENGTH = 4096;

  formatResponse(agentText: string): FormattedMessage {
    const parts = extractStructuredParts(agentText);

    if (parts && parts.length > 0) {
      // Convertir parts a texto plano
      const plainText = this.partsToPlainText(parts);
      return {
        text: this.truncate(plainText),
        parts: null, // WhatsApp no usa parts estructurados
        hasStructuredResponse: false,
      };
    }

    // Si no hay parts estructurados, devolver el texto directamente
    return {
      text: this.truncate(agentText),
      parts: null,
      hasStructuredResponse: false,
    };
  }

  supportsRichComponents(): boolean {
    return false;
  }

  /**
   * Convierte un array de AIMessagePart a texto plano
   */
  private partsToPlainText(parts: AIMessagePart[]): string {
    return parts
      .map((part) => this.partToText(part))
      .filter((text) => text.length > 0)
      .join("\n\n");
  }

  /**
   * Convierte un solo part a texto plano
   */
  private partToText(part: AIMessagePart): string {
    switch (part.type) {
      case "text":
        return part.text;

      case "services-list": {
        const lines: string[] = [];
        if (part.intro) {
          lines.push(part.intro);
        }
        lines.push(`📋 *${part.title}*`);
        lines.push("");
        for (const service of part.services) {
          const price = service.price ? ` - ${service.price}` : "";
          const duration = service.duration ? ` (${service.duration})` : "";
          lines.push(`• ${service.name}${price}${duration}`);
          if (service.description) {
            lines.push(`  ${service.description}`);
          }
        }
        return lines.join("\n");
      }

      case "availability": {
        const lines: string[] = [];
        const serviceName = part.serviceName ? ` para *${part.serviceName}*` : "";
        lines.push(`📅 Horarios disponibles${serviceName}`);
        lines.push(`Fecha: ${this.formatDate(part.date)}`);
        lines.push("");
        if (part.slots.length === 0) {
          lines.push("No hay horarios disponibles para esta fecha.");
        } else {
          for (const slot of part.slots) {
            const time = this.formatTime(slot.startTime);
            lines.push(`• ${time}`);
          }
        }
        return lines.join("\n");
      }

      case "reservation": {
        const { reservation } = part;
        const lines: string[] = [];
        lines.push(part.message || "✅ ¡Solicitud de cita registrada!");
        lines.push("");
        lines.push(`*Servicio:* ${reservation.serviceName}`);
        lines.push(`*Fecha:* ${this.formatDate(reservation.date)}`);
        lines.push(`*Hora:* ${reservation.time}`);
        lines.push(`*Paciente:* ${reservation.patientName}`);
        lines.push(`*Estado:* ${this.translateStatus(reservation.status)}`);
        return lines.join("\n");
      }

      case "faq": {
        const lines: string[] = [];
        lines.push(`❓ *${part.title}*`);
        lines.push("");
        for (const faq of part.faqs) {
          lines.push(`*Q:* ${faq.question}`);
          lines.push(`*A:* ${faq.answer}`);
          lines.push("");
        }
        return lines.join("\n").trim();
      }

      case "calendar": {
        const lines: string[] = [];
        const serviceName = part.serviceName ? ` para *${part.serviceName}*` : "";
        lines.push(`📅 ${part.title}${serviceName}`);
        lines.push("");
        lines.push("Por favor indícame qué fecha prefieres.");
        if (part.availableDates && part.availableDates.length > 0) {
          lines.push("");
          lines.push("Fechas disponibles próximamente:");
          for (const date of part.availableDates.slice(0, 5)) {
            lines.push(`• ${this.formatDate(date)}`);
          }
        }
        return lines.join("\n");
      }

      case "patient-form": {
        const lines: string[] = [];
        lines.push(`📝 ${part.title}`);
        lines.push("");
        lines.push(`Servicio: *${part.serviceName}*`);
        lines.push(`Fecha: ${this.formatDate(part.date)}`);
        lines.push(`Hora: ${part.time}`);
        lines.push("");
        lines.push("Para continuar, necesito algunos datos:");
        lines.push("• Nombre completo");
        lines.push("• Teléfono");
        lines.push("• Motivo de consulta (opcional)");
        return lines.join("\n");
      }

      case "confirmation": {
        const lines: string[] = [];
        lines.push(`*${part.title}*`);
        lines.push("");
        lines.push(part.message);
        lines.push("");
        lines.push(`Responde *${part.confirmLabel}* para confirmar o *${part.cancelLabel}* para cancelar.`);
        return lines.join("\n");
      }

      default:
        // Fallback para tipos desconocidos
        return "";
    }
  }

  /**
   * Trunca texto al límite máximo
   */
  private truncate(text: string): string {
    if (text.length <= this.MAX_LENGTH) {
      return text;
    }
    return text.slice(0, this.MAX_LENGTH - 3) + "...";
  }

  /**
   * Formatea fecha ISO a formato legible
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Formatea tiempo ISO a formato legible
   */
  private formatTime(timeStr: string): string {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  }

  /**
   * Traduce estado de reserva
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: "⏳ Pendiente de confirmación",
      confirmed: "✅ Confirmada",
      cancelled: "❌ Cancelada",
    };
    return translations[status] || status;
  }
}
