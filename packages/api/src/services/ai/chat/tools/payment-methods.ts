import { createTool } from "@voltagent/core";
import { z } from "zod";
import { PaymentMethodRepository } from "../../../../services/repository/payment-method";
import { ProfileRepository } from "../../../../services/repository/profile";

const paymentMethodRepository = new PaymentMethodRepository();
const profileRepository = new ProfileRepository();

const ListPaymentMethodsInput = z.object({
  profileId: z.string().describe("The profile ID to get payment methods for"),
  includeInactive: z
    .boolean()
    .optional()
    .describe("Include inactive payment methods (default: false)"),
});

const GetPaymentMethodDetailsInput = z.object({
  methodId: z.string().describe("The payment method ID to look up"),
});

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

export const listPaymentMethodsTool = createTool({
  name: "list_payment_methods",
  description:
    "List all available payment methods accepted by this medical practice. Use this to answer questions about payment options. Returns only ACTIVE payment methods that patients can use. This is the primary tool for payment-related questions like '¿Qué métodos de pago aceptan?', '¿Aceptan Yape?', '¿Tienen seguros?'.",
  parameters: ListPaymentMethodsInput,
  execute: async ({ profileId, includeInactive }) => {
    try {
      const profileData = await profileRepository.findById(profileId);

      if (!profileData) {
        return {
          success: false,
          error: "Profile not found",
          message: "No se encontró el perfil de la clínica.",
        };
      }

      const methods = includeInactive
        ? await paymentMethodRepository.findByProfileId(profileId)
        : await paymentMethodRepository.findActiveByProfileId(profileId);

      if (methods.length === 0 && !includeInactive) {
        return {
          success: true,
          count: 0,
          paymentMethods: [],
          text: "Esta clínica aún no tiene métodos de pago activados. Por favor contacta directamente para más información sobre opciones de pago.",
          note: "No active payment methods configured",
        };
      }

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

export const getPaymentMethodDetailsTool = createTool({
  name: "get_payment_method_details",
  description:
    "Get detailed information about a specific payment method. Use this when a patient asks about how to pay with a particular method or needs more details about payment options. Returns bank account details, wallet phone numbers, insurance information, etc.",
  parameters: GetPaymentMethodDetailsInput,
  execute: async ({ methodId }) => {
    try {
      const method = await paymentMethodRepository.findById(methodId);

      if (!method) {
        return {
          success: false,
          error: "Payment method not found",
          message: `No se encontró el método de pago con ID ${methodId}`,
        };
      }

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
