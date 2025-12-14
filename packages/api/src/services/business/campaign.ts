import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { CampaignRepository } from "../repository/campaign";
import { CampaignAudienceRepository } from "../repository/campaign-audience";
import { ClientRepository } from "../repository/client";
import { TemplateVariablesService } from "./template-variables";
import type { Campaign, NewCampaign } from "../../db/schema/campaign";
import type { CampaignAudienceStatus } from "../../db/schema/campaign-audience";
import type { RequestContext } from "../../types/context";

export class CampaignService {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignAudienceRepository: CampaignAudienceRepository,
    private clientRepository: ClientRepository,
    private templateVariablesService: TemplateVariablesService,
  ) {}

  async getCampaigns(ctx: RequestContext): Promise<Campaign[]> {
    return this.campaignRepository.findByUser(ctx);
  }

  async getCampaign(ctx: RequestContext, id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(ctx, id);
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }
    return campaign;
  }

  async createCampaign(
    ctx: RequestContext,
    data: NewCampaign,
  ): Promise<Campaign> {
    if (!data.name) {
      throw new BadRequestException("Campaign name is required");
    }

    if (!data.messageContent) {
      throw new BadRequestException("Message content is required");
    }

    return this.campaignRepository.create(data);
  }

  async updateCampaign(
    ctx: RequestContext,
    id: string,
    data: Partial<NewCampaign>,
  ): Promise<Campaign> {
    const existingCampaign = await this.campaignRepository.findById(ctx, id);
    if (!existingCampaign) {
      throw new NotFoundException("Campaign not found");
    }

    return this.campaignRepository.update(ctx, id, data);
  }

  async deleteCampaign(ctx: RequestContext, id: string): Promise<void> {
    const existingCampaign = await this.campaignRepository.findById(ctx, id);
    if (!existingCampaign) {
      throw new NotFoundException("Campaign not found");
    }

    await this.campaignRepository.delete(ctx, id);
  }

  async addAudience(
    ctx: RequestContext,
    campaignId: string,
    clientIds: string[],
  ) {
    const campaign = await this.campaignRepository.findById(ctx, campaignId);
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    // Verify all clients exist and belong to the user
    const clients = await Promise.all(
      clientIds.map((id) => this.clientRepository.findById(ctx, id)),
    );

    const validClients = clients.filter((c) => c !== null);
    if (validClients.length !== clientIds.length) {
      throw new BadRequestException("Some clients not found");
    }

    // Create audience entries
    const audienceData = validClients.map((client) => ({
      profileId: client!.profileId,
      campaignId,
      clientId: client!.id,
      status: "pending" as CampaignAudienceStatus,
    }));

    return this.campaignAudienceRepository.createMany(audienceData);
  }

  async getAudience(ctx: RequestContext, campaignId: string) {
    return this.campaignAudienceRepository.findByCampaign(ctx, campaignId);
  }

  async getCampaignStats(ctx: RequestContext, campaignId: string) {
    const campaign = await this.campaignRepository.findById(ctx, campaignId);
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const [pending, sent, delivered, failed] = await Promise.all([
      this.campaignAudienceRepository.getByStatus(ctx, campaignId, "pending" as CampaignAudienceStatus),
      this.campaignAudienceRepository.getByStatus(ctx, campaignId, "sent" as CampaignAudienceStatus),
      this.campaignAudienceRepository.getByStatus(ctx, campaignId, "delivered" as CampaignAudienceStatus),
      this.campaignAudienceRepository.getByStatus(ctx, campaignId, "failed" as CampaignAudienceStatus),
    ]);

    return {
      total: campaign.totalRecipients,
      pending: pending.length,
      sent: sent.length,
      delivered: delivered.length,
      failed: failed.length,
    };
  }

  async previewMessage(
    ctx: RequestContext,
    messageContent: string,
    clientId?: string,
  ): Promise<string> {
    const scopes: { type: "client" | "advisor" | "system"; entityId?: string }[] = [
      { type: "system" },
      { type: "advisor" },
    ];

    if (clientId) {
      scopes.push({ type: "client", entityId: clientId });
    }

    return this.templateVariablesService.replaceVariables(
      messageContent,
      ctx,
      scopes,
    );
  }
}
