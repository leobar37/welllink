import { Queue, Worker, Job, JobsOptions } from "bullmq";
import type { WhatsAppMessage } from "../../db/schema/whatsapp-message";
import { MessageStatus } from "../../db/schema/whatsapp-message";
import { EvolutionService } from "../business/evolution-api";
import { WhatsAppMessageRepository } from "../repository/whatsapp-message";
import { WhatsAppConfigRepository } from "../repository/whatsapp-config";

export interface WhatsAppQueueJobData {
  type: "send_message" | "send_media" | "send_template" | "retry_message";
  messageId: string;
  configId: string;
  data?: any;
  retryCount?: number;
}

export class WhatsAppQueueService {
  private messageQueue: Queue;
  private worker: Worker;
  private messageRepository: WhatsAppMessageRepository;
  private configRepository: WhatsAppConfigRepository;
  private evolutionService: EvolutionService;

  constructor(
    redisConnection: any,
    messageRepository: WhatsAppMessageRepository,
    configRepository: WhatsAppConfigRepository,
    evolutionService: EvolutionService
  ) {
    this.messageRepository = messageRepository;
    this.configRepository = configRepository;
    this.evolutionService = evolutionService;

    // Initialize queue
    this.messageQueue = new Queue("whatsapp-messages", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    // Initialize worker
    this.worker = new Worker(
      "whatsapp-messages",
      async (job: Job<WhatsAppQueueJobData>) => {
        await this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    // Setup event listeners
    this.worker.on("completed", (job: Job) => {
      console.log(`WhatsApp job completed: ${job.id}`);
    });

    this.worker.on("failed", (job: Job | undefined, err: Error) => {
      console.error(`WhatsApp job failed: ${job?.id}`, err);
    });

    this.worker.on("error", (err: Error) => {
      console.error("WhatsApp queue worker error:", err);
    });
  }

  async addSendMessageJob(
    messageId: string,
    configId: string,
    data: {
      to: string;
      content?: string;
      media?: any;
      template?: any;
      delay?: number;
    },
    options: JobsOptions = {}
  ) {
    const jobData: WhatsAppQueueJobData = {
      type: data.template ? "send_template" : data.media ? "send_media" : "send_message",
      messageId,
      configId,
      data,
    };

    return this.messageQueue.add("send-message", jobData, {
      delay: data.delay || 0,
      ...options,
    });
  }

  async addRetryJob(
    messageId: string,
    configId: string,
    retryCount: number = 0,
    options: JobsOptions = {}
  ) {
    const jobData: WhatsAppQueueJobData = {
      type: "retry_message",
      messageId,
      configId,
      retryCount,
    };

    // Exponential backoff for retries
    const delay = Math.pow(2, retryCount) * 1000; // 2^retryCount seconds

    return this.messageQueue.add("retry-message", jobData, {
      delay,
      ...options,
    });
  }

  async getJobCounts() {
    return this.messageQueue.getJobCounts();
  }

  async getQueueStatus() {
    const waiting = await this.messageQueue.getWaiting();
    const active = await this.messageQueue.getActive();
    const completed = await this.messageQueue.getCompleted();
    const failed = await this.messageQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async pauseQueue() {
    await this.worker.pause();
    await this.messageQueue.pause();
  }

  async resumeQueue() {
    await this.worker.resume();
    await this.messageQueue.resume();
  }

  async close() {
    await this.worker.close();
    await this.messageQueue.close();
  }

  private async processJob(job: Job<WhatsAppQueueJobData>) {
    const { type, messageId, configId, data, retryCount = 0 } = job.data;

    try {
      // Get message from database
      const message = await this.messageRepository.findOne({ userId: "" } as any, messageId);
      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // Get config
      const config = await this.configRepository.findOne({ userId: "" } as any, configId);
      if (!config) {
        throw new Error(`Config not found: ${configId}`);
      }

      // Check if instance is still active and connected
      if (!config.isEnabled || !config.isConnected) {
        throw new Error("WhatsApp instance is not active or connected");
      }

      let result: any;

      switch (type) {
        case "send_message":
          result = await this.evolutionService.sendText(config.instanceName, {
            number: data.to,
            text: data.content,
          });
          break;

        case "send_media":
          result = await this.evolutionService.sendMedia(config.instanceName, {
            number: data.to,
            mediatype: data.media.type,
            media: data.media.url,
            fileName: data.media.fileName,
            caption: data.media.caption,
          });
          break;

        case "send_template":
          result = await this.evolutionService.sendTemplate(config.instanceName, {
            number: data.to,
            templateName: data.template.templateName,
            templateComponents: data.template.components,
          });
          break;

        case "retry_message":
          // Retry based on message content
          if (message.content && !message.media) {
            result = await this.evolutionService.sendText(config.instanceName, {
              number: message.to,
              text: message.content,
            });
          } else if (message.media) {
            result = await this.evolutionService.sendMedia(config.instanceName, {
              number: message.to,
              mediatype: message.media.type,
              media: message.media.url,
              fileName: message.media.filename,
              caption: message.media.caption,
            });
          }
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      // Update message with WhatsApp message ID and status
      await this.messageRepository.update({ userId: "" } as any, messageId, {
        waMessageId: result.key?.id || result.messageId,
        status: MessageStatus.SENT,
        processedAt: new Date(),
        retryCount,
      });

      return result;
    } catch (error) {
      // Update message status to failed
      await this.messageRepository.update({ userId: "" } as any, messageId, {
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
        retryCount,
      });

      throw error;
    }
  }
}

// Singleton instance
let queueInstance: WhatsAppQueueService | null = null;

export async function getWhatsAppQueue(
  redisConnection: any,
  messageRepository: WhatsAppMessageRepository,
  configRepository: WhatsAppConfigRepository,
  evolutionService: EvolutionService
): Promise<WhatsAppQueueService> {
  if (!queueInstance) {
    queueInstance = new WhatsAppQueueService(
      redisConnection,
      messageRepository,
      configRepository,
      evolutionService
    );
  }
  return queueInstance;
}