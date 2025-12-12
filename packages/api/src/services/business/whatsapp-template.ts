import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type { CreateTemplateData, UpdateTemplateData } from "../../types/dto";
import { WhatsAppTemplateRepository } from "../repository/whatsapp-template";
import { WhatsAppConfigRepository } from "../repository/whatsapp-config";
import { EvolutionService } from "./evolution-api";
import { TemplateStatus, TemplateCategory } from "../../db/schema/whatsapp-template";

export class WhatsAppTemplateService {
  constructor(
    private whatsappTemplateRepository: WhatsAppTemplateRepository,
    private whatsappConfigRepository: WhatsAppConfigRepository,
    private evolutionService: EvolutionService
  ) {}

  async getTemplate(ctx: RequestContext, id: string) {
    const template = await this.whatsappTemplateRepository.findOne(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }
    return template;
  }

  async getTemplatesByConfig(ctx: RequestContext, configId: string) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    return this.whatsappTemplateRepository.findByConfig(ctx, configId);
  }

  async createTemplate(ctx: RequestContext, data: CreateTemplateData) {
    // Check if config exists and user owns it
    const config = await this.whatsappConfigRepository.findOne(ctx, data.configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    // Check if template name already exists for this config
    const existingTemplate = await this.whatsappTemplateRepository.findByName(
      ctx,
      data.configId,
      data.name
    );
    if (existingTemplate) {
      throw new ConflictException("Template name already exists");
    }

    // Create template in database as draft
    const template = await this.whatsappTemplateRepository.create(ctx, {
      configId: data.configId,
      name: data.name,
      displayName: data.displayName,
      category: data.category,
      language: data.language || "es",
      status: TemplateStatus.DRAFT,
      components: data.components,
      variables: data.variables || [],
      isActive: true,
      usageCount: "0",
    });

    // If template is ready for submission, submit to Evolution API
    if (data.submitToWhatsApp) {
      await this.submitTemplateToWhatsApp(ctx, template.id, config.instanceName);
    }

    return template;
  }

  async updateTemplate(ctx: RequestContext, id: string, data: UpdateTemplateData) {
    // Check if template exists and user owns it
    const template = await this.whatsappTemplateRepository.findOne(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    // Can only edit templates in DRAFT or REJECTED status
    if (template.status === TemplateStatus.APPROVED || template.status === TemplateStatus.PENDING) {
      throw new BadRequestException("Cannot edit approved or pending templates");
    }

    // If updating name, check uniqueness
    if (data.name && data.name !== template.name) {
      const existingTemplate = await this.whatsappTemplateRepository.findByName(
        ctx,
        template.configId,
        data.name
      );
      if (existingTemplate) {
        throw new ConflictException("Template name already exists");
      }
    }

    // Reset status to DRAFT if it was REJECTED
    const updateData = {
      ...data,
      status: template.status === TemplateStatus.REJECTED ? TemplateStatus.DRAFT : template.status,
    };

    return this.whatsappTemplateRepository.update(ctx, id, updateData);
  }

  async deleteTemplate(ctx: RequestContext, id: string) {
    // Check if template exists and user owns it
    const template = await this.whatsappTemplateRepository.findOne(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    // Cannot delete approved templates - just deactivate them
    if (template.status === TemplateStatus.APPROVED) {
      return this.whatsappTemplateRepository.toggleActive(ctx, id, false);
    }

    // Delete from Evolution API if exists
    if (template.waTemplateId) {
      const config = await this.whatsappConfigRepository.findOne(ctx, template.configId);
      if (config) {
        try {
          await this.evolutionService.deleteTemplate(config.instanceName, template.name);
        } catch (error) {
          console.error(`Failed to delete template from Evolution API: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    // Delete from database
    return this.whatsappTemplateRepository.delete(ctx, id);
  }

  async submitTemplateToWhatsApp(ctx: RequestContext, id: string, instanceName?: string) {
    const template = await this.whatsappTemplateRepository.findOne(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    if (template.status !== TemplateStatus.DRAFT) {
      throw new BadRequestException("Only draft templates can be submitted");
    }

    let targetInstanceName = instanceName;
    if (!targetInstanceName) {
      const config = await this.whatsappConfigRepository.findOne(ctx, template.configId);
      if (!config) {
        throw new NotFoundException("WhatsApp configuration not found");
      }
      targetInstanceName = config.instanceName;
    }

    try {
      // Prepare template for Evolution API
      const evolutionTemplate = {
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components,
      };

      // Submit to Evolution API
      const result = await this.evolutionService.createTemplate(targetInstanceName, evolutionTemplate);

      // Update template status
      await this.whatsappTemplateRepository.updateStatus(
        ctx,
        id,
        TemplateStatus.PENDING,
        result.id
      );

      return template;
    } catch (error) {
      throw new BadRequestException(`Failed to submit template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async toggleTemplate(ctx: RequestContext, id: string, isActive: boolean) {
    const template = await this.whatsappTemplateRepository.findOne(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    if (template.status !== TemplateStatus.APPROVED) {
      throw new BadRequestException("Only approved templates can be toggled");
    }

    return this.whatsappTemplateRepository.toggleActive(ctx, id, isActive);
  }

  async syncTemplatesFromWhatsApp(ctx: RequestContext, configId: string) {
    const config = await this.whatsappConfigRepository.findOne(ctx, configId);
    if (!config) {
      throw new NotFoundException("WhatsApp configuration not found");
    }

    try {
      // Fetch templates from Evolution API
      const evolutionTemplates = await this.evolutionService.getTemplates(config.instanceName);

      // Sync with database
      for (const evolutionTemplate of evolutionTemplates) {
        const existingTemplate = await this.whatsappTemplateRepository.findByName(
          ctx,
          configId,
          evolutionTemplate.name
        );

        if (existingTemplate) {
          // Update existing template
          await this.whatsappTemplateRepository.updateStatus(
            ctx,
            existingTemplate.id,
            this.mapEvolutionStatus(evolutionTemplate.status),
            evolutionTemplate.id,
            evolutionTemplate.rejectionReason
          );
        } else {
          // Create new template
          await this.whatsappTemplateRepository.create(ctx, {
            configId,
            name: evolutionTemplate.name,
            displayName: evolutionTemplate.displayName || evolutionTemplate.name,
            category: evolutionTemplate.category as TemplateCategory,
            language: evolutionTemplate.language,
            status: this.mapEvolutionStatus(evolutionTemplate.status),
            components: evolutionTemplate.components || [],
            variables: this.extractVariables(evolutionTemplate.components || []),
            waTemplateId: evolutionTemplate.id,
            rejectionReason: evolutionTemplate.rejectionReason,
            isActive: evolutionTemplate.status === "APPROVED",
            usageCount: "0",
          });
        }
      }

      return { message: "Templates synchronized successfully" };
    } catch (error) {
      throw new BadRequestException(`Failed to sync templates: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getTemplatesByCategory(ctx: RequestContext, configId: string, category: TemplateCategory) {
    return this.whatsappTemplateRepository.findByCategory(ctx, configId, category);
  }

  async getActiveTemplates(ctx: RequestContext, configId: string) {
    return this.whatsappTemplateRepository.findActive(ctx, configId);
  }

  async searchTemplates(ctx: RequestContext, configId: string, query: string) {
    return this.whatsappTemplateRepository.searchTemplates(ctx, configId, query);
  }

  async getTemplateStats(ctx: RequestContext, configId: string) {
    return this.whatsappTemplateRepository.getTemplateStats(ctx, configId);
  }

  private mapEvolutionStatus(evolutionStatus: string): TemplateStatus {
    const statusMap: Record<string, TemplateStatus> = {
      DRAFT: TemplateStatus.DRAFT,
      PENDING: TemplateStatus.PENDING,
      APPROVED: TemplateStatus.APPROVED,
      REJECTED: TemplateStatus.REJECTED,
      DISABLED: TemplateStatus.DISABLED,
    };

    return statusMap[evolutionStatus] || TemplateStatus.DRAFT;
  }

  private extractVariables(components: any[]): Array<{ type: string; name: string; example?: string }> {
    const variables: Array<{ type: string; name: string; example?: string }> = [];

    for (const component of components) {
      if (component.parameters) {
        for (const param of component.parameters) {
          variables.push({
            type: param.type,
            name: param.parameter || "",
            example: param.example,
          });
        }
      }
    }

    return variables;
  }
}