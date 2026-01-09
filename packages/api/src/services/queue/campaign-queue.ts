import { Queue, Worker, Job } from "bullmq";
import { CampaignRepository } from "../repository/campaign";
import { CampaignAudienceRepository } from "../repository/campaign-audience";
import { ClientRepository } from "../repository/client";
import { TemplateVariablesService } from "../business/template-variables";
import { CampaignStatus, CampaignAudienceStatus } from "../../db/schema";
import type { RequestContext } from "../../types/context";
import { getBullMQRedisConnection } from "../../lib/redis";

export interface CampaignQueueJobData {
  campaignId: string;
  profileId: string;
  ctx: RequestContext;
}

export class CampaignQueueService {
  private queue: Queue;
  private worker: Worker;

  constructor(
    private campaignRepository: CampaignRepository,
    private campaignAudienceRepository: CampaignAudienceRepository,
    private clientRepository: ClientRepository,
    private templateVariablesService: TemplateVariablesService,
  ) {
    const redisConnection = getBullMQRedisConnection();

    // Initialize queue
    this.queue = new Queue("campaign-sending", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1, // Campaigns don't retry at job level
      },
    });

    // Initialize worker
    this.worker = new Worker(
      "campaign-sending",
      async (job: Job<CampaignQueueJobData>) => {
        await this.processCampaign(job);
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process 5 campaigns in parallel max
      },
    );

    // Event listeners
    this.worker.on("completed", (job: Job) => {
      console.log(`Campaign job completed: ${job.id}`);
    });

    this.worker.on("failed", (job: Job | undefined, err: Error) => {
      console.error(`Campaign job failed: ${job?.id}`, err);
    });
  }

  async addCampaignJob(
    campaignId: string,
    profileId: string,
    ctx: RequestContext,
  ) {
    return this.queue.add("send-campaign", {
      campaignId,
      profileId,
      ctx,
    });
  }

  private async processCampaign(job: Job<CampaignQueueJobData>) {
    const { campaignId, profileId, ctx } = job.data;

    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(ctx, campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Update campaign status to SENDING
      await this.campaignRepository.update(ctx, campaignId, {
        status: CampaignStatus.SENDING,
      });

      // Get all audience members for this campaign
      const audienceMembers =
        await this.campaignAudienceRepository.findByCampaign(ctx, campaignId);

      if (audienceMembers.length === 0) {
        throw new Error("Campaign has no recipients");
      }

      // Process in batches of 50 (rate limit)
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < audienceMembers.length; i += BATCH_SIZE) {
        batches.push(audienceMembers.slice(i, i + BATCH_SIZE));
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const batch of batches) {
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(async (audienceMember) => {
            const client = await this.clientRepository.findById(
              ctx,
              audienceMember.clientId,
            );

            if (!client) {
              throw new Error(`Client not found: ${audienceMember.clientId}`);
            }

            // Replace variables in message using the service with scopes
            const personalizedMessage =
              await this.templateVariablesService.replaceVariables(
                campaign.messageContent,
                ctx,
                [
                  { type: "client", entityId: client.id },
                  { type: "advisor" },
                  { type: "system" },
                ],
              );

            // Note: This is where you'd integrate with the WhatsApp queue
            // For now, we'll just mark as sent
            // await this.whatsappQueue.addSendMessageJob(...);

            // Update audience member status
            await this.campaignAudienceRepository.update(
              ctx,
              audienceMember.id,
              {
                status: CampaignAudienceStatus.SENT,
                sentAt: new Date(),
              },
            );

            return { success: true };
          }),
        );

        // Count results
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            sentCount++;
          } else {
            failedCount++;
          }
        });

        // Wait 60 seconds between batches (rate limiting: 50 msg/min)
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }

      // Update campaign final status
      await this.campaignRepository.update(ctx, campaignId, {
        status: sentCount > 0 ? CampaignStatus.SENT : CampaignStatus.FAILED,
        sentCount,
        failedCount,
        sentAt: new Date(),
      });

      return {
        campaignId,
        sentCount,
        failedCount,
        totalRecipients: audienceMembers.length,
      };
    } catch (error) {
      // Mark campaign as failed
      await this.campaignRepository.update(ctx, campaignId, {
        status: CampaignStatus.FAILED,
      });

      throw error;
    }
  }

  async getQueueStatus() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}

// Singleton instance
let campaignQueueInstance: CampaignQueueService | null = null;

export async function getCampaignQueue(
  campaignRepository: CampaignRepository,
  campaignAudienceRepository: CampaignAudienceRepository,
  clientRepository: ClientRepository,
  templateVariablesService: TemplateVariablesService,
): Promise<CampaignQueueService> {
  if (!campaignQueueInstance) {
    campaignQueueInstance = new CampaignQueueService(
      campaignRepository,
      campaignAudienceRepository,
      clientRepository,
      templateVariablesService,
    );
  }
  return campaignQueueInstance;
}
