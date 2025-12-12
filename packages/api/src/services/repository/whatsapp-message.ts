import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db";
import { whatsappMessage, MessageDirection, MessageStatus } from "../../db/schema/whatsapp-message";
import type { RequestContext } from "../../types/context";

export class WhatsAppMessageRepository {
  async findByConfig(ctx: RequestContext, configId: string, limit = 50, offset = 0) {
    return db.query.whatsappMessage.findMany({
      where: eq(whatsappMessage.configId, configId),
      orderBy: [desc(whatsappMessage.createdAt)],
      limit,
      offset,
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const message = await db.query.whatsappMessage.findFirst({
      where: eq(whatsappMessage.id, id),
    });

    return message;
  }

  async findByMessageId(ctx: RequestContext, messageId: string) {
    const message = await db.query.whatsappMessage.findFirst({
      where: eq(whatsappMessage.messageId, messageId),
      with: {
        config: {
          columns: {
            profileId: true,
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own messages
    if (message?.config.userId !== ctx.userId) {
      return null;
    }

    return message;
  }

  async findByWaMessageId(ctx: RequestContext, waMessageId: string) {
    const message = await db.query.whatsappMessage.findFirst({
      where: eq(whatsappMessage.waMessageId, waMessageId),
      with: {
        config: {
          columns: {
            profileId: true,
            userId: true,
          },
        },
      },
    });

    // Ensure user can only access their own messages
    if (message?.config.userId !== ctx.userId) {
      return null;
    }

    return message;
  }

  async findConversation(ctx: RequestContext, configId: string, phoneNumber: string, limit = 50) {
    return db.query.whatsappMessage.findMany({
      where: and(
        eq(whatsappMessage.configId, configId),
        // Messages where user is either sender or receiver
        db.sql`(from = ${phoneNumber} OR to = ${phoneNumber})`
      ),
      orderBy: [desc(whatsappMessage.createdAt)],
      limit,
    });
  }

  async create(ctx: RequestContext, data: Omit<typeof whatsappMessage.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [message] = await db
      .insert(whatsappMessage)
      .values(data)
      .returning();

    return message;
  }

  async update(ctx: RequestContext, id: string, data: Partial<typeof whatsappMessage.$inferInsert>) {
    const [message] = await db
      .update(whatsappMessage)
      .set(data)
      .where(eq(whatsappMessage.id, id))
      .returning();

    return message;
  }

  async updateStatus(
    ctx: RequestContext,
    waMessageId: string,
    status: MessageStatus,
    error?: string
  ) {
    const updateData: Partial<typeof whatsappMessage.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };

    if (error) {
      updateData.error = error;
    }

    if (status === MessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === MessageStatus.READ) {
      updateData.readAt = new Date();
    }

    const [message] = await db
      .update(whatsappMessage)
      .set(updateData)
      .where(eq(whatsappMessage.waMessageId, waMessageId))
      .returning();

    return message;
  }

  async incrementRetry(ctx: RequestContext, id: string) {
    const [message] = await db
      .update(whatsappMessage)
      .set({
        retryCount: db.sql`retry_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(whatsappMessage.id, id))
      .returning();

    return message;
  }

  async getPendingMessages(ctx: RequestContext, limit = 100) {
    return db.query.whatsappMessage.findMany({
      where: eq(whatsappMessage.status, MessageStatus.PENDING),
      with: {
        config: {
          columns: {
            instanceId: true,
            isEnabled: true,
            isConnected: true,
            userId: true,
          },
        },
      },
      orderBy: [whatsappMessage.createdAt],
      limit,
    });
  }

  async getFailedMessages(ctx: RequestContext, retryLimit = 3) {
    return db.query.whatsappMessage.findMany({
      where: and(
        eq(whatsappMessage.status, MessageStatus.FAILED),
        db.sql`retry_count < ${retryLimit}`
      ),
      with: {
        config: {
          columns: {
            instanceId: true,
            isEnabled: true,
            isConnected: true,
            userId: true,
          },
        },
      },
      orderBy: [desc(whatsappMessage.createdAt)],
      limit: 50,
    });
  }

  async getConversationList(ctx: RequestContext, configId: string) {
    const conversations = await db
      .select({
        phoneNumber: whatsappMessage.from,
        lastMessage: whatsappMessage.content,
        lastMessageAt: whatsappMessage.createdAt,
        unreadCount: db.sql`COUNT(*)`,
      })
      .from(whatsappMessage)
      .where(
        and(
          eq(whatsappMessage.configId, configId),
          eq(whatsappMessage.direction, MessageDirection.INBOUND)
        )
      )
      .groupBy(whatsappMessage.from)
      .orderBy(desc(whatsappMessage.createdAt));

    return conversations;
  }

  async getMessageStats(ctx: RequestContext, configId: string, startDate?: Date, endDate?: Date) {
    const whereConditions = [eq(whatsappMessage.configId, configId)];

    if (startDate) {
      whereConditions.push(db.sql`created_at >= ${startDate}`);
    }
    if (endDate) {
      whereConditions.push(db.sql`created_at <= ${endDate}`);
    }

    const stats = await db
      .select({
        total: db.sql`COUNT(*)`,
        sent: db.sql`SUM(CASE WHEN status = '${MessageStatus.SENT}' THEN 1 ELSE 0 END)`,
        delivered: db.sql`SUM(CASE WHEN status = '${MessageStatus.DELIVERED}' THEN 1 ELSE 0 END)`,
        read: db.sql`SUM(CASE WHEN status = '${MessageStatus.READ}' THEN 1 ELSE 0 END)`,
        failed: db.sql`SUM(CASE WHEN status = '${MessageStatus.FAILED}' THEN 1 ELSE 0 END)`,
      })
      .from(whatsappMessage)
      .where(and(...whereConditions));

    return stats[0] || {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };
  }
}