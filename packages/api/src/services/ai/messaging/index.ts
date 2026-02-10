// Types
export type { ChannelType, FormattedMessage, FormatOptions } from "./types";

// Strategy interface
export type { MessageStrategy } from "./message-strategy.interface";

// Factory
export {
  getMessageStrategy,
  isChannelSupported,
  getSupportedChannels,
} from "./message-strategy.factory";

// Strategies
export { WhatsAppMessageStrategy } from "./strategies/whatsapp.strategy";
export { WebChatMessageStrategy } from "./strategies/webchat.strategy";
