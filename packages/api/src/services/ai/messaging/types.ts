import type { AIMessagePart } from "../chat/schema";

/**
 * Tipos de canal soportados por el sistema de mensajería
 */
export type ChannelType = "whatsapp" | "webchat";

/**
 * Mensaje formateado para un canal específico
 */
export interface FormattedMessage {
  /** Texto de la respuesta (siempre presente) */
  text: string;

  /** Parts estructurados para canales que los soportan (WebChat) */
  parts: AIMessagePart[] | null;

  /** Indica si la respuesta tiene componentes estructurados */
  hasStructuredResponse: boolean;
}

/**
 * Opciones para formatear una respuesta
 */
export interface FormatOptions {
  /** Canal destino */
  channel: ChannelType;

  /** Información del perfil para personalización */
  profileName?: string;

  /** Si incluir emojis en el texto formateado */
  includeEmojis?: boolean;
}
