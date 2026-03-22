import type { Tool } from "@voltagent/core";
import type { ToolCategory } from "../db/schema/profile";

export interface ToolWithCategory {
  tool: Tool;
  category: ToolCategory;
}

export const toolCategoryMap: Map<string, ToolCategory> = new Map([
  ["get_patient", "patient"],
  ["create_patient", "patient"],
  ["update_patient_label", "patient"],
  ["list_services", "services"],
  ["get_service_details", "services"],
  ["check_availability", "appointments"],
  ["create_reservation", "appointments"],
  ["search_faq", "faq"],
  ["list_payment_methods", "payments"],
  ["get_payment_method_details", "payments"],
  ["check_inventory", "inventory"],
  ["get_product_info", "inventory"],
  ["get_client_history", "recommendations"],
  ["get_service_recommendations", "recommendations"],
  ["get_upsell_recommendations", "recommendations"],
  ["load_whatsapp_context", "whatsapp"],
  ["pause_for_human", "whatsapp"],
]);

export const allToolCategories: ToolCategory[] = [
  "patient",
  "services",
  "appointments",
  "faq",
  "payments",
  "inventory",
  "recommendations",
  "whatsapp",
];

export const defaultEnabledCategories: ToolCategory[] = [
  "patient",
  "services",
  "appointments",
  "faq",
  "payments",
];

export function filterToolsByCategories(
  tools: Tool[],
  enabledCategories: ToolCategory[],
): Tool[] {
  if (!enabledCategories || enabledCategories.length === 0) {
    return tools;
  }

  return tools.filter((tool) => {
    const category = toolCategoryMap.get(tool.name);
    if (!category) {
      return true;
    }
    return enabledCategories.includes(category);
  });
}

export function getToolCategoriesForProfile(
  enabledToolCategories?: ToolCategory[],
): ToolCategory[] {
  if (!enabledToolCategories || enabledToolCategories.length === 0) {
    return defaultEnabledCategories;
  }
  return enabledToolCategories;
}
