import { createTool } from "@voltagent/core";
import { z } from "zod";

const SuggestTransferInput = z.object({
  reason: z
    .string()
    .describe("Razón por la que se debe transferir al chat widget"),
  contextSummary: z.string().describe("Resumen de la conversación hasta ahora"),
});

export const suggestTransferTool = createTool({
  name: "suggest_transfer",
  description:
    "SUGERIR TRANSFERENCIA AL CHAT WIDGET. Usar cuando la consulta requiere agendar cita, ver disponibilidad o información personalizada que el agente de WhatsApp no puede resolver. Esta tool guarda el contexto y marca que se debe transferir, pero NO genera el link - el webhook handler lo hace.",
  parameters: SuggestTransferInput,
  execute: async ({ reason, contextSummary }) => {
    return {
      action: "suggest_transfer",
      reason,
      contextSummary,
      message:
        "Para esto es mejor que conversemos directamente. Te paso a nuestro chat donde podrás agendar tu cita con calma.",
      shouldTransfer: true,
    };
  },
});
