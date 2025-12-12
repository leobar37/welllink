import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type { CreateMessageData, SendMediaData, SendTemplateData } from "../../types/dto";
import { WhatsAppMessageRepository } from "../repository/whatsapp-message";
import { WhatsAppConfigRepository } from "../repository/whatsapp-config";
import { EvolutionService } from "./evolution-api";
import { MessageDirection, MessageStatus } from "../../db/schema/whatsapp-message";
import { v4 as uuidv4 } from "uuid";

export class WhatsAppService {
  constructor(
    private whatsappMessageRepository: WhatsAppMessageRepository,
    private whatsappConfigRepository: WhatsAppConfigRepository,
    private evolutionService: EvolutionService
  ) {}

  async sendMessage(ctx: RequestContext, configId: string, data: CreateMessageData) {
    // Check if config exists and is active
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (!config.isEnabled || !config.isConnected) {
      throw new BadRequestException("WhatsApp instance is not active or connected");
    }

    // Format phone number
    const toNumber = this.evolutionService.formatPhoneNumber(data.to);

    // Create message record
    const message = await this.whatsappMessageRepository.create(ctx, {
      configId,
      messageId: uuidv4(),
      direction: MessageDirection.OUTBOUND,
      from: config.phone || "", // Will be updated when connected
      to: toNumber,
      content: data.content,
      status: MessageStatus.PENDING,
    });

    // Send message via Evolution API
    try {
      const result = await this.evolutionService.sendText(config.instanceName, {
        number: toNumber,
        text: data.content,
        delay: data.delay,
        presence: data.presence,
        quotedMessage: data.quotedMessage,
      });

      // Update message with WhatsApp message ID
      await this.whatsappMessageRepository.update(ctx, message.id, {
        waMessageId: result.key?.id || result.messageId,
        status: MessageStatus.SENT,
        processedAt: new Date(),
      });

      return message;
    } catch (error) {
      // Update message status to failed
      await this.whatsappMessageRepository.update(ctx, message.id, {
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new BadRequestException(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async sendMedia(ctx: RequestContext, configId: string, data: SendMediaData) {
    // Check if config exists and is active
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (!config.isEnabled || !config.isConnected) {
      throw new BadRequestException("WhatsApp instance is not active or connected");
    }

    // Format phone number
    const toNumber = this.evolutionService.formatPhoneNumber(data.to);

    // Create message record
    const message = await this.whatsappMessageRepository.create(ctx, {
      configId,
      messageId: uuidv4(),
      direction: MessageDirection.OUTBOUND,
      from: config.phone || "",
      to: toNumber,
      content: data.caption,
      media: {
        type: data.mediatype,
        url: data.media,
        mimetype: data.mimetype || this.getMimeTypeFromType(data.mediatype),
        filename: data.fileName,
        caption: data.caption,
      },
      status: MessageStatus.PENDING,
    });

    // Send media via Evolution API
    try {
      const result = await this.evolutionService.sendMedia(config.instanceName, {
        number: toNumber,
        mediatype: data.mediatype,
        media: data.media,
        fileName: data.fileName,
        caption: data.caption,
        delay: data.delay,
      });

      // Update message with WhatsApp message ID
      await this.whatsappMessageRepository.update(ctx, message.id, {
        waMessageId: result.key?.id || result.messageId,
        status: MessageStatus.SENT,
        processedAt: new Date(),
      });

      return message;
    } catch (error) {
      // Update message status to failed
      await this.whatsappMessageRepository.update(ctx, message.id, {
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new BadRequestException(`Failed to send media: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async sendTemplate(ctx: RequestContext, configId: string, data: SendTemplateData) {
    // Check if config exists and is active
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (!config.isEnabled || !config.isConnected) {
      throw new BadRequestException("WhatsApp instance is not active or connected");
    }

    // Format phone number
    const toNumber = this.evolutionService.formatPhoneNumber(data.to);

    // Create message record
    const message = await this.whatsappMessageRepository.create(ctx, {
      configId,
      messageId: uuidv4(),
      direction: MessageDirection.OUTBOUND,
      from: config.phone || "",
      to: toNumber,
      content: `Template: ${data.templateName}`,
      status: MessageStatus.PENDING,
    });

    // Send template via Evolution API
    try {
      const result = await this.evolutionService.sendTemplate(config.instanceName, {
        number: toNumber,
        templateName: data.templateName,
        templateComponents: data.components,
      });

      // Update message with WhatsApp message ID
      await this.whatsappMessageRepository.update(ctx, message.id, {
        waMessageId: result.key?.id || result.messageId,
        status: MessageStatus.SENT,
        processedAt: new Date(),
      });

      return message;
    } catch (error) {
      // Update message status to failed
      await this.whatsappMessageRepository.update(ctx, message.id, {
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new BadRequestException(`Failed to send template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMessages(ctx: RequestContext, configId: string, limit = 50, offset = 0) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    return this.whatsappMessageRepository.findByConfig(ctx, configId, limit, offset);
  }

  async getConversation(ctx: RequestContext, configId: string, phoneNumber: string, limit = 50) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    const formattedNumber = this.evolutionService.formatPhoneNumber(phoneNumber);
    return this.whatsappMessageRepository.findConversation(ctx, configId, formattedNumber, limit);
  }

  async getConversationList(ctx: RequestContext, configId: string) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    return this.whatsappConfigRepository.getConversationList(configId);
  }

  async getMessageStats(ctx: RequestContext, configId: string, startDate?: Date, endDate?: Date) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    return this.whatsappMessageRepository.getMessageStats(ctx, configId, startDate, endDate);
  }

  async retryFailedMessage(ctx: RequestContext, messageId: string) {
    const message = await this.whatsappMessageRepository.findOne(ctx, messageId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.status !== MessageStatus.FAILED) {
      throw new BadRequestException("Message is not in failed status");
    }

    // Get config
    const config = await this.whatsappConfigRepository.findOne(ctx, message.configId);
    if (!config || !config.isEnabled || !config.isConnected) {
      throw new BadRequestException("WhatsApp instance is not active or connected");
    }

    // Increment retry count
    await this.whatsappMessageRepository.incrementRetry(ctx, messageId);

    // Retry sending based on message type
    try {
      if (message.content && !message.media) {
        // Text message
        const result = await this.evolutionService.sendText(config.instanceName, {
          number: message.to,
          text: message.content,
        });

        await this.whatsappMessageRepository.update(ctx, messageId, {
          waMessageId: result.key?.id || result.messageId,
          status: MessageStatus.SENT,
          processedAt: new Date(),
        });
      } else if (message.media) {
        // Media message
        const result = await this.evolutionService.sendMedia(config.instanceName, {
          number: message.to,
          mediatype: message.media.type,
          media: message.media.url,
          fileName: message.media.filename,
          caption: message.media.caption,
        });

        await this.whatsappMessageRepository.update(ctx, messageId, {
          waMessageId: result.key?.id || result.messageId,
          status: MessageStatus.SENT,
          processedAt: new Date(),
        });
      }

      return message;
    } catch (error) {
      // Update message status to failed again
      await this.whatsappMessageRepository.update(ctx, messageId, {
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new BadRequestException(`Failed to retry message: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Webhook handler for inbound messages and status updates
  async handleWebhook(ctx: RequestContext, instanceName: string, eventData: any) {
    // Find config by instance name
    const config = await this.whatsappConfigRepository.findByInstanceName(ctx, instanceName);
    if (!config) {
      console.warn(`Webhook received for unknown instance: ${instanceName}`);
      return;
    }

    const { event, data } = eventData;

    switch (event) {
      case "messages.upsert":
        // New message received
        if (data.message && data.key) {
          await this.handleInboundMessage(ctx, config.id, data);
        }
        break;

      case "messages.update":
        // Message status updated
        if (data.status) {
          await this.handleMessageStatusUpdate(ctx, data);
        }
        break;

      case "connection.update":
        // Connection status changed
        if (data.state) {
          const isConnected = data.state === "open" || data.state === "connected";
          await this.whatsappConfigRepository.updateConnectionStatus(
            ctx,
            config.instanceId,
            isConnected,
            data.number
          );
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handleInboundMessage(ctx: RequestContext, configId: string, messageData: any) {
    const content = this.evolutionService.extractMessageContent(messageData);

    await this.whatsappMessageRepository.create(ctx, {
      configId,
      messageId: uuidv4(),
      waMessageId: messageData.key.id,
      direction: MessageDirection.INBOUND,
      from: messageData.key.remoteJid,
      to: messageData.key.fromMe ? messageData.key.remoteJid : "",
      content: content.text,
      media: content.media,
      status: MessageStatus.DELIVERED,
      processedAt: new Date(),
      deliveredAt: new Date(),
      metadata: messageData,
    });
  }

  private async handleMessageStatusUpdate(ctx: RequestContext, data: any) {
    const statusMap: Record<string, MessageStatus> = {
      PENDING: MessageStatus.PENDING,
      SENT: MessageStatus.SENT,
      DELIVERED: MessageStatus.DELIVERED,
      READ: MessageStatus.READ,
      FAILED: MessageStatus.FAILED,
    };

    const status = statusMap[data.status];
    if (status) {
      await this.whatsappMessageRepository.updateStatus(
        ctx,
        data.key.id,
        status,
        data.statusMessage
      );
    }
  }

  private getMimeTypeFromType(type: string): string {
    const mimeTypes: Record<string, string> = {
      image: "image/jpeg",
      video: "video/mp4",
      document: "application/pdf",
      audio: "audio/ogg",
    };

    return mimeTypes[type] || "application/octet-stream";
  }
}