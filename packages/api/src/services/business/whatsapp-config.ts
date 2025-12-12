import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type { CreateWhatsAppConfigData, UpdateWhatsAppConfigData } from "../../types/dto";
import { WhatsAppConfigRepository } from "../repository/whatsapp-config";
import { EvolutionService } from "./evolution-api";
import type { WhatsAppConfig } from "../../db/schema/whatsapp-config";

export class WhatsAppConfigService {
  constructor(
    private whatsappConfigRepository: WhatsAppConfigRepository,
    private evolutionService: EvolutionService
  ) {}

  async getConfig(ctx: RequestContext, id: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }
    return config;
  }

  async getConfigsByProfile(ctx: RequestContext, profileId: string) {
    return this.whatsappConfigRepository.findByProfile(ctx, profileId);
  }

  async createConfig(ctx: RequestContext, data: CreateWhatsAppConfigData) {
    // Check if instance name already exists for this user
    const existingConfig = await this.whatsappConfigRepository.findByInstanceName(
      ctx,
      data.instanceName
    );
    if (existingConfig) {
      throw new ConflictException("Instance name already exists");
    }

    // Create instance in Evolution API
    try {
      const evolutionInstance = await this.evolutionService.createInstance(
        data.instanceName,
        data.config
      );

      // Save to database
      const config = await this.whatsappConfigRepository.create(ctx, {
        profileId: data.profileId,
        instanceName: data.instanceName,
        instanceId: evolutionInstance.instanceId || data.instanceName,
        token: data.config.token || "",
        webhookUrl: data.config.webhook?.url,
        isEnabled: false, // Start disabled until properly configured
        isConnected: false,
        config: {
          instanceName: data.instanceName,
          instanceId: evolutionInstance.instanceId || data.instanceName,
          token: data.config.token || "",
          webhookUrl: data.config.webhook?.url || "",
          qrcode: true,
          webhook: data.config.webhook || {
            enabled: false,
            url: "",
            events: [],
          },
          chatbot: data.config.chatbot || {
            enabled: false,
            ignoreGroups: true,
            ignoreBroadcast: true,
          },
        },
      });

      return config;
    } catch (error) {
      throw new BadRequestException(`Failed to create WhatsApp instance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateConfig(
    ctx: RequestContext,
    id: string,
    data: UpdateWhatsAppConfigData
  ) {
    // Check if config exists and user owns it
    const existingConfig = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!existingConfig) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    // If updating instance name, check uniqueness
    if (data.instanceName && data.instanceName !== existingConfig.instanceName) {
      const existingInstanceName = await this.whatsappConfigRepository.findByInstanceName(
        ctx,
        data.instanceName
      );
      if (existingInstanceName) {
        throw new ConflictException("Instance name already exists");
      }
    }

    // Prepare config update
    const updatedConfig = {
      ...existingConfig,
      ...data,
      config: {
        ...existingConfig.config,
        ...data.config,
      },
    };

    return this.whatsappConfigRepository.update(ctx, id, updatedConfig);
  }

  async deleteConfig(ctx: RequestContext, id: string) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    try {
      // Delete from Evolution API
      await this.evolutionService.deleteInstance(config.instanceName);

      // Delete from database
      return this.whatsappConfigRepository.delete(ctx, id);
    } catch (error) {
      // If Evolution API deletion fails, still delete from database but log error
      console.error(`Failed to delete Evolution instance: ${error instanceof Error ? error.message : "Unknown error"}`);
      return this.whatsappConfigRepository.delete(ctx, id);
    }
  }

  async connectInstance(ctx: RequestContext, id: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (config.isConnected) {
      throw new BadRequestException("Instance is already connected");
    }

    try {
      const { qrcode } = await this.evolutionService.generateQRCode(config.instanceName);

      // Update connection status (still false until QR is scanned)
      await this.whatsappConfigRepository.update(ctx, id, {
        lastActivityAt: new Date(),
      });

      return {
        qrcode: qrcode.base64,
        instanceName: config.instanceName,
        message: "QR code generated. Please scan with WhatsApp to connect.",
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async disconnectInstance(ctx: RequestContext, id: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (!config.isConnected) {
      throw new BadRequestException("Instance is not connected");
    }

    try {
      await this.evolutionService.disconnectInstance(config.instanceName);

      // Update connection status
      await this.whatsappConfigRepository.updateConnectionStatus(
        ctx,
        config.instanceId,
        false
      );

      return { message: "Instance disconnected successfully" };
    } catch (error) {
      throw new BadRequestException(`Failed to disconnect instance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async checkConnectionStatus(ctx: RequestContext, id: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    try {
      const connectionStatus = await this.evolutionService.checkConnection(config.instanceName);

      // Update connection status if changed
      if (connectionStatus.result !== config.isConnected) {
        await this.whatsappConfigRepository.updateConnectionStatus(
          ctx,
          config.instanceId,
          connectionStatus.result
        );
      }

      return {
        isConnected: connectionStatus.result,
        state: connectionStatus.state,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to check connection status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getInstanceInfo(ctx: RequestContext, id: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    try {
      const instance = await this.evolutionService.getInstance(config.instanceName);
      return {
        instance,
        config,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get instance info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async toggleInstance(ctx: RequestContext, id: string, isEnabled: boolean) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    // Can't enable if not connected
    if (isEnabled && !config.isConnected) {
      throw new BadRequestException("Cannot enable instance. Please connect first.");
    }

    return this.whatsappConfigRepository.update(ctx, id, { isEnabled });
  }

  async updateWebhookUrl(ctx: RequestContext, id: string, webhookUrl: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    const updatedConfig = {
      ...config,
      webhookUrl,
      config: {
        ...config.config,
        webhookUrl,
        webhook: {
          ...config.config.webhook,
          url: webhookUrl,
          enabled: webhookUrl ? true : false,
        },
      },
    };

    return this.whatsappConfigRepository.update(ctx, id, updatedConfig);
  }

  async getProfile(ctx: RequestContext, instanceName: string) {
    const config = await this.whatsappConfigRepository.findByInstanceName(ctx, instanceName);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    if (!config.isConnected) {
      throw new BadRequestException("Instance is not connected");
    }

    try {
      const instance = await this.evolutionService.getInstance(instanceName);
      return {
        phone: instance.number,
        profilePicUrl: instance.profilePicUrl,
        pushname: instance.profile?.pushname,
        isConnected: instance.connection.isOnline,
        state: instance.connection.state,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}