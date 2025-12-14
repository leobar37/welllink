import { format } from "date-fns";
import { ProfileRepository } from "../repository/profile";
import { ClientRepository } from "../repository/client";
import type { RequestContext } from "../../types/context";

export const TEMPLATE_VARIABLES = {
  NOMBRE_CLIENTE: "{nombre_cliente}",
  NOMBRE_ASESOR: "{nombre_asesor}",
  TELEFONO: "{telefono}",
  FECHA_ACTUAL: "{fecha_actual}",
  HORA_ACTUAL: "{hora_actual}",
} as const;

export type TemplateVariable =
  (typeof TEMPLATE_VARIABLES)[keyof typeof TEMPLATE_VARIABLES];

export interface VariableScope {
  type: "client" | "advisor" | "system";
  entityId?: string;
}

export interface TemplateVariableData {
  clientName: string;
  advisorName: string;
  phone: string;
}

export class TemplateVariablesService {
  constructor(
    private profileRepository: ProfileRepository,
    private clientRepository: ClientRepository,
  ) {}

  /**
   * Replaces variables in a template with actual values
   * Supports lazy loading for complex variables
   */
  async replaceVariables(
    template: string,
    context: RequestContext,
    scopes: VariableScope[],
  ): Promise<string> {
    const variableMap = await this.buildVariableMap(context, scopes);

    return this.replaceAllVariables(template, variableMap);
  }

  /**
   * Extracts all variables from a template
   */
  extractVariables(template: string): string[] {
    const regex = /{(\w+)}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      matches.push(`{${match[1]}}`);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Validates that all variables in a template are supported
   */
  validateTemplate(template: string): {
    valid: boolean;
    invalidVariables: string[];
  } {
    const extracted = this.extractVariables(template);
    const validVariables = Object.values(TEMPLATE_VARIABLES);
    const invalidVariables = extracted.filter(
      (v) => !validVariables.includes(v as TemplateVariable),
    );

    return {
      valid: invalidVariables.length === 0,
      invalidVariables,
    };
  }

  /**
   * Builds a map of variables to values based on scopes
   * Uses lazy loading for expensive operations
   */
  private async buildVariableMap(
    context: RequestContext,
    scopes: VariableScope[],
  ): Promise<Record<string, string>> {
    const variableMap: Record<string, string> = {};
    const now = new Date();

    // System variables (always available)
    variableMap[TEMPLATE_VARIABLES.FECHA_ACTUAL] = format(now, "dd/MM/yyyy");
    variableMap[TEMPLATE_VARIABLES.HORA_ACTUAL] = format(now, "HH:mm");

    // Process each scope
    for (const scope of scopes) {
      switch (scope.type) {
        case "client":
          if (scope.entityId) {
            await this.addClientVariables(variableMap, context, scope.entityId);
          }
          break;
        case "advisor":
          await this.addAdvisorVariables(variableMap, context);
          break;
      }
    }

    return variableMap;
  }

  /**
   * Adds client-scoped variables (lazy loaded)
   */
  private async addClientVariables(
    variableMap: Record<string, string>,
    context: RequestContext,
    clientId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findById(context, clientId);
    if (!client) return;

    variableMap[TEMPLATE_VARIABLES.NOMBRE_CLIENTE] = client.name;
    variableMap[TEMPLATE_VARIABLES.TELEFONO] = client.phone;
  }

  /**
   * Adds advisor-scoped variables (lazy loaded)
   */
  private async addAdvisorVariables(
    variableMap: Record<string, string>,
    context: RequestContext,
  ): Promise<void> {
    const profiles = await this.profileRepository.findByUser(context, context.userId);
    if (profiles.length === 0) return;

    const profile = profiles[0]; // Use the first profile
    variableMap[TEMPLATE_VARIABLES.NOMBRE_ASESOR] = profile.displayName;
  }

  /**
   * Performs variable replacement using a prepared map
   */
  private replaceAllVariables(
    template: string,
    variableMap: Record<string, string>,
  ): string {
    let result = template;

    for (const [variable, value] of Object.entries(variableMap)) {
      const escapedVariable = variable.replace(/[{}]/g, "");
      result = result.replace(new RegExp(escapedVariable, "g"), value);
    }

    return result;
  }
}
