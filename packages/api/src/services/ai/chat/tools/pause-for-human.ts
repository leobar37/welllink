import { createTool } from "@voltagent/core";
import { z } from "zod";

const PauseForHumanInput = z.object({
  phone: z.string().describe("Número de teléfono del usuario"),
  reason: z.string().describe("Razón por la que se necesita atención humana"),
});

export const pauseForHumanTool = createTool({
  name: "pause_for_human",
  description: `PAUSAR CONVERSACIÓN Y TRANSFERIR A ATENCIÓN HUMANA.
  
Usa esto SOLO cuando:
- El caso requiere decisiones médicas que el agente no puede tomar
- El usuario explícitamente pide hablar con un humano
- Hay información sensible que requiere verificación
- El flujo está atorado y no puede continuar

Esta tool:
1. Pausa el contexto de WhatsApp (si existe)
2. Genera un link de WhatsApp directo para que el doctor atienda
3. El agente de WhatsApp NO se activará para esta conversación

NO uses esto para:
- Agendar citas (el agente puede hacerlo)
- Preguntas frecuentes
- Información general
- Seguimientos simples`,
  parameters: PauseForHumanInput,
  execute: async ({ phone, reason }) => {
    const { WhatsAppContextRepository } =
      await import("../../../../services/repository/whatsapp-context");
    const { db } = await import("../../../../db");
    const { profile } = await import("../../../../db/schema");
    const { eq } = await import("drizzle-orm");

    const contextRepository = new WhatsAppContextRepository();

    // 1. Pause context of WhatsApp
    await contextRepository.markPausedForHuman(phone);

    // 2. Get profile to generate doctor WhatsApp link
    const context = await contextRepository.findByPhone(phone);

    if (!context || !context.profileId) {
      return {
        action: "pause_for_human",
        success: true,
        message:
          "He pausado la atención automatizada. Puedes contactar directamente al doctor por WhatsApp.",
        directWhatsAppLink: null,
        whatsappPaused: true,
      };
    }

    const profileData = await db.query.profile.findFirst({
      where: eq(profile.id, context.profileId),
    });

    if (!profileData || !profileData.whatsappNumber) {
      return {
        action: "pause_for_human",
        success: true,
        message:
          "He pausado la atención automatizada. El doctor te contactará directamente.",
        directWhatsAppLink: null,
        whatsappPaused: true,
      };
    }

    // 3. Generate direct WhatsApp link to doctor
    const message = encodeURIComponent(
      `🆘 Atención Humana Requerida
      
Teléfono: ${phone}
Motivo: ${reason}

Por favor atender a la brevedad.`,
    );

    const directWhatsAppLink = `https://wa.me/${profileData.whatsappNumber}?text=${message}`;

    return {
      action: "pause_for_human",
      success: true,
      message: `He pausado la atención automatizada. 
      
El doctor ha sido notificado y puedes contactarlo directamente:

${directWhatsAppLink}

ℹ️ El agente de WhatsApp no continuará esta conversación. 
El doctor te atenderá personalmente.`,
      directWhatsAppLink,
      whatsappPaused: true,
    };
  },
});
