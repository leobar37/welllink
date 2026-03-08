import { Agent } from "@voltagent/core";

import { chatAgentConfig, createChatAgentConfig } from "./config";
import { createChatMemory } from "./memory/config";
import {
  getPatientTool,
  createPatientTool,
  updatePatientLabelTool,
  listServicesTool,
  getServiceDetailsTool,
  createReservationTool,
  checkAvailabilityTool,
  searchFAQTool,
  listPaymentMethodsTool,
  getPaymentMethodDetailsTool,
  loadWhatsAppContextTool,
  pauseForHumanTool,
  checkInventoryTool,
  getProductInfoTool,
} from "./tools";

/**
 * Create the medical chat agent with all tools and memory
 * @param instructions - Optional custom instructions (uses default if not provided)
 */
export function createMedicalChatAgent(instructions?: string): Agent {
  // Create persistent memory for conversation history
  const memory = createChatMemory();

  // Use custom instructions if provided, otherwise use default config
  const config = instructions
    ? createChatAgentConfig(instructions)
    : chatAgentConfig;

  // Create the agent with all tools
  const agent = new Agent({
    ...config,
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

      // Inventory tools
      checkInventoryTool,
      getProductInfoTool,

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
