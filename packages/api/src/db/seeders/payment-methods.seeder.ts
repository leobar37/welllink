import { PaymentMethodRepository } from "../../services/repository/payment-method";
import { createdProfileIds } from "./profiles.seeder";
import type { NewPaymentMethod } from "../../db/schema/payment-method";

export const createdPaymentMethodIds: Record<string, string> = {};

const DEFAULT_PAYMENT_METHODS: Array<Omit<NewPaymentMethod, "profileId">> = [
  {
    name: "Efectivo",
    type: "cash",
    instructions: "Pago en efectivo en clínica",
    displayOrder: 1,
    isActive: false,
  },
  {
    name: "Tarjeta de Crédito / Débito",
    type: "credit_card",
    instructions: "Visa, Mastercard, American Express",
    details: { networks: ["Visa", "Mastercard", "American Express"] },
    displayOrder: 2,
    isActive: false,
  },
  {
    name: "Yape",
    type: "digital_wallet",
    instructions: "Pago móvil con Yape (BCP)",
    details: {
      provider: "Yape",
      phone: "+51 999 123 456",
    },
    displayOrder: 3,
    isActive: false,
  },
  {
    name: "Plin",
    type: "digital_wallet",
    instructions: "Pago móvil con Plin (Interbank)",
    details: {
      provider: "Plin",
      phone: "+51 999 789 012",
    },
    displayOrder: 4,
    isActive: false,
  },
  {
    name: "Transferencia Bancaria",
    type: "bank_transfer",
    instructions: "Transferencia a cuenta bancaria",
    displayOrder: 5,
    isActive: false,
  },
];

export async function seedPaymentMethods() {
  console.log("💳 Seeding payment methods...");

  const paymentMethodRepository = new PaymentMethodRepository();
  const profileKeys = ["maria", "clinic"];

  for (const profileKey of profileKeys) {
    const profileId = createdProfileIds[profileKey];

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping payment methods`,
      );
      continue;
    }

    // Check if profile already has payment methods
    const existingCount =
      await paymentMethodRepository.countByProfileId(profileId);

    if (existingCount > 0) {
      console.log(
        `  ✓ Payment methods already exist for profile ${profileKey}, skipping`,
      );
      continue;
    }

    const created = await paymentMethodRepository.createMany(
      profileId,
      DEFAULT_PAYMENT_METHODS,
    );

    console.log(
      `  ✓ Created ${created.length} payment methods for profile ${profileKey}`,
    );
  }

  console.log("✅ Payment methods seeded successfully\n");
}
