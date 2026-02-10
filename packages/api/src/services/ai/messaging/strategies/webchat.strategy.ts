import { extractStructuredParts } from "../../chat/parser";
import type { MessageStrategy } from "../message-strategy.interface";
import type { ChannelType, FormattedMessage } from "../types";

/**
 * Estrategia de formateo para Web Chat.
 *
 * Mantiene las respuestas estructuradas del agente IA en formato JSON
 * para que el frontend pueda renderizar componentes interactivos.
 *
 * Características:
 * - Mantiene JSON parts para renderizado interactivo
 * - Soporta componentes ricos (servicios, calendario, formularios)
 * - No transforma el contenido, solo lo pasa through
 */
export class WebChatMessageStrategy implements MessageStrategy {
  readonly channel: ChannelType = "webchat";

  formatResponse(agentText: string): FormattedMessage {
    const parts = extractStructuredParts(agentText);

    return {
      text: agentText,
      parts: parts,
      hasStructuredResponse: parts !== null,
    };
  }

  supportsRichComponents(): boolean {
    return true;
  }
}
