import { eq, desc, and, asc } from "drizzle-orm";
import { db } from "../../db";
import {
  whatsappContext,
  type WhatsAppContext,
  type NewWhatsAppContext,
  WhatsAppContextStatus,
} from "../../db/schema/whatsapp-context";

export interface MessageEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface CreateWhatsAppContextParams {
  phone: string;
  profileId: string;
  initialMessage: string;
}

export class WhatsAppContextRepository {
  async create(params: CreateWhatsAppContextParams): Promise<WhatsAppContext> {
    const [context] = await db
      .insert(whatsappContext)
      .values({
        phone: params.phone,
        profileId: params.profileId,
        conversationHistory: [
          {
            role: "user",
            content: params.initialMessage,
            timestamp: Date.now(),
          },
        ],
        contextSummary: `Consulta inicial: ${params.initialMessage.substring(0, 150)}...`,
        lastInteractionAt: new Date(),
        status: WhatsAppContextStatus.ACTIVE,
      })
      .returning();

    return context;
  }

  async findByPhone(phone: string): Promise<WhatsAppContext | undefined> {
    const [context] = await db
      .select()
      .from(whatsappContext)
      .where(eq(whatsappContext.phone, phone))
      .orderBy(desc(whatsappContext.lastInteractionAt))
      .limit(1);

    return context;
  }

  async findByPhoneAndProfile(
    phone: string,
    profileId: string,
  ): Promise<WhatsAppContext | undefined> {
    const [context] = await db
      .select()
      .from(whatsappContext)
      .where(eq(whatsappContext.phone, phone))
      .limit(1);

    return context;
  }

  async findByProfileAndStatus(
    profileId: string,
    status: WhatsAppContextStatus,
  ): Promise<WhatsAppContext[]> {
    const contexts = await db
      .select()
      .from(whatsappContext)
      .where(
        and(
          eq(whatsappContext.profileId, profileId),
          eq(whatsappContext.status, status),
        ),
      )
      .orderBy(asc(whatsappContext.lastInteractionAt));

    return contexts;
  }

  async findByProfile(
    profileId: string,
    limit: number = 50,
  ): Promise<WhatsAppContext[]> {
    const contexts = await db
      .select()
      .from(whatsappContext)
      .where(eq(whatsappContext.profileId, profileId))
      .orderBy(desc(whatsappContext.lastInteractionAt))
      .limit(limit);

    return contexts;
  }

  async addMessage(
    phone: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> {
    const context = await this.findByPhone(phone);
    if (!context) return;

    const history: MessageEntry[] =
      (context.conversationHistory as MessageEntry[]) || [];
    history.push({ role, content, timestamp: Date.now() });

    const trimmedHistory = history.slice(-20);

    const summaryUpdate =
      role === "user"
        ? `Último mensaje: ${content.substring(0, 150)}...`
        : context.contextSummary;

    await db
      .update(whatsappContext)
      .set({
        conversationHistory: trimmedHistory,
        contextSummary: summaryUpdate,
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappContext.phone, phone));
  }

  async markTransferredToWidget(phone: string): Promise<void> {
    await db
      .update(whatsappContext)
      .set({
        status: WhatsAppContextStatus.TRANSFERRED_TO_WIDGET,
        transferredToWidgetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappContext.phone, phone));
  }

  async markPausedForHuman(phone: string): Promise<void> {
    await db
      .update(whatsappContext)
      .set({
        status: WhatsAppContextStatus.PAUSED_FOR_HUMAN,
        pausedForHumanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappContext.phone, phone));
  }

  async linkToPatient(phone: string, patientId: string): Promise<void> {
    await db
      .update(whatsappContext)
      .set({
        patientId,
        updatedAt: new Date(),
      })
      .where(eq(whatsappContext.phone, phone));
  }

  async getContextForWidget(phone: string): Promise<{
    found: boolean;
    status: string | null;
    history: MessageEntry[] | null;
    summary: string | null;
    patientId: string | null;
  } | null> {
    const context = await this.findByPhone(phone);
    if (!context) return null;

    return {
      found: true,
      status: context.status,
      history: (context.conversationHistory as MessageEntry[]) || [],
      summary: context.contextSummary,
      patientId: context.patientId,
    };
  }

  async generateWidgetSummary(phone: string): Promise<string | null> {
    const context = await this.findByPhone(phone);
    if (!context) return null;

    const history: MessageEntry[] =
      (context.conversationHistory as MessageEntry[]) || [];

    if (history.length === 0) return null;

    const userMessages = history.filter((m) => m.role === "user").slice(-5);
    const lastUserMessage = userMessages[userMessages.length - 1];

    return `
=== CONTEXTO DE WHATSAPP ===
Última interacción: ${context.lastInteractionAt?.toLocaleString() || "N/A"}
Resumen: ${context.contextSummary}

Últimos mensajes del usuario:
${userMessages.map((m) => `- ${new Date(m.timestamp).toLocaleTimeString()}: ${m.content}`).join("\n")}
===========================
    `.trim();
  }
}
