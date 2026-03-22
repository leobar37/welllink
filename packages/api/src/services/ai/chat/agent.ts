import { Agent } from "@voltagent/core";
import type { Tool } from "@voltagent/core";
import type { ToolCategory } from "../../../db/schema/profile";
import {
  filterToolsByCategories,
  getToolCategoriesForProfile,
} from "../../../utils/agent-tool-filter";

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
  getClientHistoryTool,
  getServiceRecommendationsTool,
  getUpsellRecommendationsTool,
} from "./tools";

const allTools: Tool[] = [
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

  // Client history and recommendations
  getClientHistoryTool,
  getServiceRecommendationsTool,
  getUpsellRecommendationsTool,

  // WhatsApp context tools
  loadWhatsAppContextTool,
  pauseForHumanTool,
];

interface CreateAgentOptions {
  instructions?: string;
  enabledToolCategories?: ToolCategory[];
}

/**
 * Create the medical chat agent with all tools and memory
 * @param options - Agent configuration options
 * @param options.instructions - Optional custom instructions (uses default if not provided)
 * @param options.enabledToolCategories - Optional array of enabled tool categories (defaults to all core tools)
 */
export function createMedicalChatAgent(options?: CreateAgentOptions): Agent;
export function createMedicalChatAgent(instructions?: string): Agent;
export function createMedicalChatAgent(
  optionsOrInstructions?: CreateAgentOptions | string,
): Agent {
  // Parse arguments
  const options: CreateAgentOptions =
    typeof optionsOrInstructions === "string"
      ? { instructions: optionsOrInstructions }
      : optionsOrInstructions || {};

  const { instructions, enabledToolCategories } = options;

  // Create persistent memory for conversation history
  const memory = createChatMemory();

  // Use custom instructions if provided, otherwise use default config
  const config = instructions
    ? createChatAgentConfig(instructions)
    : chatAgentConfig;

  // Determine which tool categories to enable
  const categories = getToolCategoriesForProfile(enabledToolCategories);

  // Filter tools based on enabled categories
  const filteredTools = filterToolsByCategories(allTools, categories);

  // Create the agent with filtered tools
  const agent = new Agent({
    ...config,
    tools: filteredTools,

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
