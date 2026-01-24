import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { AgentConfigRepository } from "../repository/agent-config";
import type {
  AgentConfig,
  TonePreset,
  AgentConfigData,
} from "../../db/schema/agent-config";
import { defaultAgentConfig } from "../../db/schema/agent-config";

export type { AgentConfig, AgentConfigData, TonePreset };

// Tone preset definitions with their instructions
export const TONE_PRESETS: Record<
  TonePreset,
  { description: string; instructions: string }
> = {
  formal: {
    description: "Tono formal y profesional, ideal para especialistas médicos",
    instructions: `Eres un asistente virtual formal y profesional de {nombre}.

Tu estilo de comunicación:
- Usa un trato respetuoso y formal
- Estructura tus respuestas de manera clara y organizada
- Usa términos médicos cuando sea apropiado pero explicándolos
- Mantén un tono serio pero amable
- Evita coloquialismos excesivos
- Usa saludos como "Buenos días/tardes" al iniciar conversaciones

Nunca:
- Usar jerga o slang
- Ser demasiado casual o informal
- Hacer bromas o comentarios humorísticos`,
  },
  professional: {
    description: "Balance profesional y cercano, ideal para medicina general",
    instructions: `Eres un asistente virtual profesional y cálido de {nombre}.

Tu estilo de comunicación:
- Balancea profesionalismo con cercanía
- Usa un tono friendly pero mantienen seriedad
- Ofrece ayuda de manera accesible
- Usa un trato de "tú" pero respetuoso
- Sonríe a través de tus palabras (expresiones amables)
- Muestra empatía genuina

Nunca:
- Ser frío o distante
- Ser excesivamente casual
- Perder el profesionalismo`,
  },
  friendly: {
    description: "Tono amigable y cercano, ideal para nutriología y psicología",
    instructions: `Eres un asistente virtual amigable y cercano de {nombre}.

Tu estilo de comunicación:
- Usa un trato cálido y accesible
- Sonríe y transmite positivismo
- Usa un tono de "tú" conversacional
- Haz que el usuario se sienta cómodo y bienvenido
- Usa expresiones amables y encouraging
- Muestra genuino interés en ayudar

Recuerda:
- La amabilidad no debe sacrificar la claridad
- Mantén la información precisa
- Puedes usar expresiones coloquiales menores`,
  },
};

// Get instructions for a specific tone preset
export function getToneInstructions(
  preset: TonePreset,
  professionalName: string,
): string {
  const template =
    TONE_PRESETS[preset]?.instructions ||
    TONE_PRESETS.professional.instructions;
  return template.replace("{nombre}", professionalName);
}

export class AgentConfigService {
  constructor(private agentConfigRepository: AgentConfigRepository) {}

  async getConfig(
    ctx: RequestContext,
    profileId: string,
  ): Promise<AgentConfig | null> {
    const config = await this.agentConfigRepository.findByProfile(
      ctx,
      profileId,
    );
    return config;
  }

  async getConfigById(ctx: RequestContext, id: string): Promise<AgentConfig> {
    const config = await this.agentConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("Agent configuration not found");
    }
    return config;
  }

  async createConfig(
    ctx: RequestContext,
    profileId: string,
  ): Promise<AgentConfig> {
    // Check if config already exists for this profile
    const existingConfig = await this.agentConfigRepository.findByProfile(
      ctx,
      profileId,
    );
    if (existingConfig) {
      return existingConfig;
    }

    // Create new config with defaults
    return this.agentConfigRepository.create(ctx, {
      profileId,
      tonePreset: defaultAgentConfig.tonePreset,
      customInstructions: defaultAgentConfig.customInstructions || "",
      welcomeMessage: defaultAgentConfig.welcomeMessage.replace("{nombre}", ""),
      farewellMessage: defaultAgentConfig.farewellMessage || "",
      suggestions: defaultAgentConfig.suggestions,
      widgetEnabled: defaultAgentConfig.widgetEnabled,
      widgetPosition: defaultAgentConfig.widgetPosition,
      widgetPrimaryColor: defaultAgentConfig.widgetPrimaryColor || null,
      whatsappEnabled: defaultAgentConfig.whatsappEnabled,
      whatsappAutoTransfer: defaultAgentConfig.whatsappAutoTransfer,
      whatsappMaxMessageLength: defaultAgentConfig.whatsappMaxMessageLength,
    });
  }

  async updateConfig(
    ctx: RequestContext,
    profileId: string,
    data: Partial<AgentConfigData>,
  ): Promise<AgentConfig> {
    const existingConfig = await this.agentConfigRepository.findByProfile(
      ctx,
      profileId,
    );

    if (!existingConfig) {
      // Create if doesn't exist
      return this.createConfig(ctx, profileId);
    }

    const updateData: Partial<AgentConfig> = {
      ...data,
      updatedAt: new Date(),
    };

    return this.agentConfigRepository.update(
      ctx,
      existingConfig.id,
      updateData,
    );
  }

  async deleteConfig(ctx: RequestContext, id: string): Promise<void> {
    const config = await this.agentConfigRepository.findOne(ctx, id);
    if (!config) {
      throw new NotFoundException("Agent configuration not found");
    }

    await this.agentConfigRepository.delete(ctx, id);
  }

  async getEffectiveInstructions(
    ctx: RequestContext,
    profileId: string,
    professionalName: string,
  ): Promise<string> {
    const config = await this.getConfig(ctx, profileId);

    if (!config) {
      // Return default instructions
      return getToneInstructions("professional", professionalName);
    }

    // Start with preset instructions
    let instructions = getToneInstructions(
      config.tonePreset as TonePreset,
      professionalName,
    );

    // Add custom instructions if present
    if (config.customInstructions && config.customInstructions.trim()) {
      instructions += `\n\nInstrucciones personalizadas del profesional:\n${config.customInstructions.trim()}`;
    }

    return instructions;
  }

  async getWelcomeMessage(
    ctx: RequestContext,
    profileId: string,
  ): Promise<string> {
    const config = await this.getConfig(ctx, profileId);

    if (!config || !config.welcomeMessage) {
      return defaultAgentConfig.welcomeMessage;
    }

    return config.welcomeMessage;
  }

  async getSuggestions(
    ctx: RequestContext,
    profileId: string,
  ): Promise<string[]> {
    const config = await this.getConfig(ctx, profileId);

    if (!config || !config.suggestions || config.suggestions.length === 0) {
      return defaultAgentConfig.suggestions;
    }

    return config.suggestions;
  }
}
