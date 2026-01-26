import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { paymentMethod } from "../../../../db/schema/payment-method";
import { profile } from "../../../../db/schema/profile";
import { eq, and, asc } from "drizzle-orm";

/**
 * Input schema for listing payment methods
 */
const ListPaymentMethodsInput = z.object({
  profileId: z.string().describe("The profile ID to get payment methods for"),
  includeInactive: z
    .boolean()
    .optional()
    .describe("Include inactive payment methods (default: false)"),
});

/**
 * Input schema for getting payment method details
 */
const GetPaymentMethodDetailsInput = z.object({
  methodId: z.string().describe("The payment method ID to look up"),
});

/**
 * Helper function to format payment type for display
 */
function formatPaymentType(type: string): string {
  const types: Record<string, string> = {
    cash: "Efectivo",
    credit_card: "Tarjeta de Crédito",
    debit_card: "Tarjeta de Débito",
    bank_transfer: "Transferencia Bancaria",
    digital_wallet: "Billetera Digital",
    insurance: "Seguro Médico",
    payment_plan: "Plan de Pago",
  };
  return types[type] || type;
}

/**
 * Helper function to get icon for payment type
 */
function getPaymentIcon(type: string): string {
  const icons: Record<string, string> = {
    cash: "💵",
    credit_card: "💳",
    debit_card: "💳",
    bank_transfer: "🏦",
    digital_wallet: "📱",
    insurance: "🛡️",
    payment_plan: "📅",
  };
  return icons[type] || "💰";
}

/**
 * Helper function to format payment list for response
 */
function formatPaymentListForResponse(
  methods: Array<{ name: string; type: string; instructions: string | null }>,
): string {
  if (methods.length === 0) {
    return "Actualmente no hay métodos de pago disponibles activados.";
  }

  const list = methods.map((m) => {
    let text = `• **${m.name}** (${m.type})`;
    if (m.instructions) {
      text += `: ${m.instructions}`;
    }
    return text;
  });

  return `Métodos de pago disponibles:\n${list.join("\n")}`;
}

/**
 * Tool to list available payment methods for the clinic
 */
export const listPaymentMethodsTool = createTool({
  name: "list_payment_methods",
  description:
    "List all available payment methods accepted by this medical practice. Use this to answer questions about payment options. Returns only ACTIVE payment methods that patients can use. This is the primary tool for payment-related questions like '¿Qué métodos de pago aceptan?', '¿Aceptan Yape?', '¿Tienen seguros?'.",
  parameters: ListPaymentMethodsInput,
  execute: async ({ profileId, includeInactive }) => {
    try {
      // Verify profile exists and get user context
      const [profileData] = await db
        .select({ id: profile.id })
        .from(profile)
        .where(eq(profile.id, profileId))
        .limit(1);

      if (!profileData) {
        return {
          success: false,
          error: "Profile not found",
          message: "No se encontró el perfil de la clínica.",
        };
      }

      // Get payment methods - only active by default
      const conditions = includeInactive
        ? eq(paymentMethod.profileId, profileId)
        : and(
            eq(paymentMethod.profileId, profileId),
            eq(paymentMethod.isActive, true),
          );

      const methods = await db
        .select({
          id: paymentMethod.id,
          name: paymentMethod.name,
          type: paymentMethod.type,
          instructions: paymentMethod.instructions,
          details: paymentMethod.details,
          displayOrder: paymentMethod.displayOrder,
        })
        .from(paymentMethod)
        .where(conditions)
        .orderBy(asc(paymentMethod.displayOrder));

      // If no active methods found
      if (methods.length === 0 && !includeInactive) {
        return {
          success: true,
          count: 0,
          paymentMethods: [],
          text: "Esta clínica aún no tiene métodos de pago activados. Por favor contacta directamente para más información sobre opciones de pago.",
          note: "No active payment methods configured",
        };
      }

      // Format for patient-friendly response
      const formattedMethods = methods.map((m) => ({
        id: m.id,
        name: m.name,
        type: formatPaymentType(m.type),
        typeCode: m.type,
        instructions: m.instructions,
        icon: getPaymentIcon(m.type),
        details: m.details,
      }));

      return {
        success: true,
        count: formattedMethods.length,
        paymentMethods: formattedMethods,
        text: formatPaymentListForResponse(formattedMethods),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Error listing payment methods: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Tool to get detailed information about a specific payment method
 */
export const getPaymentMethodDetailsTool = createTool({
  name: "get_payment_method_details",
  description:
    "Get detailed information about a specific payment method. Use this when a patient asks about how to pay with a particular method or needs more details about payment options. Returns bank account details, wallet phone numbers, insurance information, etc.",
  parameters: GetPaymentMethodDetailsInput,
  execute: async ({ methodId }) => {
    try {
      const [method] = await db
        .select({
          id: paymentMethod.id,
          name: paymentMethod.name,
          type: paymentMethod.type,
          instructions: paymentMethod.instructions,
          details: paymentMethod.details,
        })
        .from(paymentMethod)
        .where(eq(paymentMethod.id, methodId))
        .limit(1);

      if (!method) {
        return {
          success: false,
          error: "Payment method not found",
          message: `No se encontró el método de pago con ID ${methodId}`,
        };
      }

      // Format details based on type
      let formattedDetails = "";
      if (method.details) {
        const details = method.details as Record<string, unknown>;
        switch (method.type) {
          case "bank_transfer":
            formattedDetails = `Banco: ${details.bankName}\nTipo de cuenta: ${details.accountType}\nNúmero de cuenta: ${details.accountNumber}`;
            if (details.clabe) {
              formattedDetails += `\nCLABE: ${details.clabe}`;
            }
            break;
          case "digital_wallet":
            formattedDetails = `${details.provider}: ${details.phone}`;
            break;
          case "insurance":
            formattedDetails = `Aseguradora: ${details.provider}\nCódigo: ${details.policyPrefix}`;
            break;
          case "payment_plan":
            formattedDetails = `Plazo: ${details.months} meses\nCuotas: ${details.installments}\nInterés: ${details.interest}%`;
            break;
        }
      }

      return {
        success: true,
        paymentMethod: {
          id: method.id,
          name: method.name,
          type: formatPaymentType(method.type),
          typeCode: method.type,
          instructions: method.instructions,
          formattedDetails,
          details: method.details,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Error getting payment method details: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
