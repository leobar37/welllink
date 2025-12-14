import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { CampaignTemplateRepository } from "../repository/campaign-template";
import type {
  CampaignTemplate,
  NewCampaignTemplate,
} from "../../db/schema/campaign-template";
import type { RequestContext } from "../../types/context";

export class CampaignTemplateService {
  constructor(private campaignTemplateRepository: CampaignTemplateRepository) {}

  async getTemplates(ctx: RequestContext): Promise<CampaignTemplate[]> {
    return this.campaignTemplateRepository.findByUser(ctx);
  }

  async getTemplate(ctx: RequestContext, id: string): Promise<CampaignTemplate> {
    const template = await this.campaignTemplateRepository.findById(ctx, id);
    if (!template) {
      throw new NotFoundException("Template not found");
    }
    return template;
  }

  async createTemplate(
    ctx: RequestContext,
    data: NewCampaignTemplate,
  ): Promise<CampaignTemplate> {
    if (!data.name) {
      throw new BadRequestException("Template name is required");
    }

    if (!data.content) {
      throw new BadRequestException("Template content is required");
    }

    return this.campaignTemplateRepository.create(data);
  }

  async updateTemplate(
    ctx: RequestContext,
    id: string,
    data: Partial<NewCampaignTemplate>,
  ): Promise<CampaignTemplate> {
    const existingTemplate = await this.campaignTemplateRepository.findById(
      ctx,
      id,
    );
    if (!existingTemplate) {
      throw new NotFoundException("Template not found");
    }

    return this.campaignTemplateRepository.update(ctx, id, data);
  }

  async deleteTemplate(ctx: RequestContext, id: string): Promise<void> {
    const existingTemplate = await this.campaignTemplateRepository.findById(
      ctx,
      id,
    );
    if (!existingTemplate) {
      throw new NotFoundException("Template not found");
    }

    await this.campaignTemplateRepository.delete(ctx, id);
  }

  async useTemplate(ctx: RequestContext, id: string): Promise<CampaignTemplate> {
    return this.campaignTemplateRepository.incrementUsage(ctx, id);
  }
}
