import { WhatsAppMessageStrategy } from "./strategies/whatsapp.strategy";
import { WebChatMessageStrategy } from "./strategies/webchat.strategy";
import type { MessageStrategy } from "./message-strategy.interface";
import type { ChannelType } from "./types";

/**
 * Instancias singleton de las estrategias
 */
const strategies: Record<ChannelType, MessageStrategy> = {
  whatsapp: new WhatsAppMessageStrategy(),
  webchat: new WebChatMessageStrategy(),
};

/**
 * Obtiene la estrategia de formateo para un canal específico.
 *
 * @param channel - Canal destino ('whatsapp' | 'webchat')
 * @returns Estrategia de formateo para el canal
 * @throws Error si el canal no es soportado
 *
 * @example
 * ```typescript
 * const strategy = getMessageStrategy('whatsapp');
 * const formatted = strategy.formatResponse(agentText);
 * ```
 */
export function getMessageStrategy(channel: ChannelType): MessageStrategy {
  const strategy = strategies[channel];
  if (!strategy) {
    throw new Error(`Channel '${channel}' is not supported. `);
  }
  return strategy;
}

/**
 * Verifica si un canal está soportado.
 *
 * @param channel - Canal a verificar
 * @returns true si el canal está soportado
 */
export function isChannelSupported(channel: string): channel is ChannelType {
  return channel in strategies;
}

/**
 * Obtiene todos los canales soportados.
 *
 * @returns Array con los nombres de los canales soportados
 */
export function getSupportedChannels(): ChannelType[] {
  return Object.keys(strategies) as ChannelType[];
}
