import { createTool } from "@voltagent/core";
import { z } from "zod";
import { WhatsAppContextRepository } from "../../../../services/repository/whatsapp-context";

const repository = new WhatsAppContextRepository();

const LoadWhatsAppContextInput = z.object({
  phone: z.string().describe("Número de teléfono del usuario"),
});

export const loadWhatsAppContextTool = createTool({
  name: "load_whatsapp_context",
  description: `Cargar el contexto de conversación previa de WhatsApp.
  
Úsalo cuando un usuario llegue desde WhatsApp para continuar la conversación.
Devolverá el historial de mensajes y un resumen del contexto.

Esta tool NO identifica al usuario - solo carga el contexto histórico.
Para identificación usa las tools de paciente.`,
  parameters: LoadWhatsAppContextInput,
  execute: async ({ phone }) => {
    const context = await repository.findByPhone(phone);

    if (!context) {
      return {
        found: false,
        message: "No se encontró contexto previo de WhatsApp para este número",
        isNewConversation: true,
      };
    }

    if (context.status === "PAUSED_FOR_HUMAN") {
      return {
        found: true,
        status: "PAUSED_FOR_HUMAN",
        message: "Esta conversación está pausada para atención humana directa",
        canContinue: false,
      };
    }

    const history =
      (context.conversationHistory as Array<{
        role: string;
        content: string;
        timestamp: number;
      }>) || [];

    return {
      found: true,
      status: context.status,
      history,
      summary: context.contextSummary,
      patientId: context.patientId,
      canContinue: true,
    };
  },
});
