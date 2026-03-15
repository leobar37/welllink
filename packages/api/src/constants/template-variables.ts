/**
 * Centralized template variables for the wellness-link system
 * These variables can be used in:
 * - WhatsApp messages
 * - Email templates
 * - Campaign messages
 * - Agent welcome/farewell messages
 *
 * IMPORTANT: Keep this file in sync with any frontend usage
 */
export const SYSTEM_VARIABLES = {
  NOMBRE: "{nombre}",
  NOMBRE_CLIENTE: "{nombre_cliente}",
  NOMBRE_ASESOR: "{nombre_asesor}",
  TELEFONO: "{telefono}",
  FECHA_ACTUAL: "{fecha_actual}",
  HORA_ACTUAL: "{hora_actual}",
} as const;

export const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  "{nombre}": "Nombre del profesional/negocio (del perfil)",
  "{nombre_cliente}": "Nombre del cliente",
  "{nombre_asesor}": "Nombre del asesor/profesional",
  "{telefono}": "Teléfono del cliente",
  "{fecha_actual}": "Fecha actual (dd/MM/yyyy)",
  "{hora_actual}": "Hora actual (HH:mm)",
};

export type SystemVariable =
  (typeof SYSTEM_VARIABLES)[keyof typeof SYSTEM_VARIABLES];

export const ALL_SUPPORTED_VARIABLES = Object.values(SYSTEM_VARIABLES);

export function getVariableDescription(variable: string): string {
  return VARIABLE_DESCRIPTIONS[variable] || "Variable personalizada";
}

export function isSupportedVariable(variable: string): boolean {
  return variable in VARIABLE_DESCRIPTIONS;
}
