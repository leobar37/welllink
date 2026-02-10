import type { ChannelType, FormattedMessage } from "./types";

/**
 * Interfaz base para estrategias de formateo de mensajes.
 *
 * Cada canal (WhatsApp, WebChat) implementa esta interfaz para convertir
 * las respuestas del agente IA al formato apropiado para ese canal.
 *
 * @example
 * ```typescript
 * const strategy = getMessageStrategy('whatsapp');
 * const formatted = strategy.formatResponse(agentText);
 * await sendToWhatsApp(formatted.text);
 * ```
 */
export interface MessageStrategy {
  /** Identificador del canal */
  readonly channel: ChannelType;

  /**
   * Formatea la respuesta del agente IA para este canal.
   *
   * - WhatsApp: Convierte JSON parts a texto plano legible
   * - WebChat: Mantiene JSON parts para renderizado interactivo
   *
   * @param agentText - Texto crudo generado por el agente IA (puede contener JSON)
   * @returns Mensaje formateado para el canal
   */
  formatResponse(agentText: string): FormattedMessage;

  /**
   * Indica si el canal soporta componentes interactivos ricos.
   *
   * @returns true si el canal soporta parts estructurados (WebChat)
   */
  supportsRichComponents(): boolean;
}
