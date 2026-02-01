import { Agent } from "@voltagent/core";

import { chatAgentConfig } from "./config";
import { createChatMemory } from "./memory/config";
import {
  getPatientTool,
  createPatientTool,
  updatePatientLabelTool,
  listServicesTool,
  getServiceDetailsTool,
  checkAvailabilityTool,
  createReservationTool,
  searchFAQTool,
  listPaymentMethodsTool,
  getPaymentMethodDetailsTool,
  loadWhatsAppContextTool,
  pauseForHumanTool,
} from "./tools";

/**
 * Create the medical chat agent with all tools and memory
 */
export function createMedicalChatAgent(): Agent {
  // Create persistent memory for conversation history
  const memory = createChatMemory();

  // Create the agent with all tools
  const agent = new Agent({
    ...chatAgentConfig,
    tools: [
      // Patient management tools
      getPatientTool,
      createPatientTool,
      updatePatientLabelTool,

      // Service information tools
      listServicesTool,
      getServiceDetailsTool,

      // Appointment scheduling tools
      checkAvailabilityTool,
      createReservationTool,

      // FAQ and information tools
      searchFAQTool,

      // Payment information tools
      listPaymentMethodsTool,
      getPaymentMethodDetailsTool,

      // WhatsApp context tools
      loadWhatsAppContextTool,
      pauseForHumanTool,
    ],

    // Attach persistent memory
    memory,
  });

  return agent;
}

/**
 * Singleton agent instance for reuse across requests
 * This avoids recreating the agent for each request
 */
let agentInstance: Agent | null = null;

/**
 * Get or create the singleton agent instance
 */
export function getMedicalChatAgent(): Agent {
  if (!agentInstance) {
    agentInstance = createMedicalChatAgent();
  }
  return agentInstance;
}

/**
 * Reset the agent instance (useful for testing)
 */
export function resetAgentInstance(): void {
  agentInstance = null;
}
