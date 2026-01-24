import { PaymentMethodRepository } from "../repository/payment-method";
import type {
  PaymentMethod,
  NewPaymentMethod,
} from "../../db/schema/payment-method";
import type {
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from "../../types/dto";
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";

export class PaymentMethodService {
  constructor(private paymentMethodRepo: PaymentMethodRepository) {}

  async getPaymentMethods(profileId: string) {
    return await this.paymentMethodRepo.findByProfileId(profileId);
  }

  async getActivePaymentMethods(profileId: string) {
    return await this.paymentMethodRepo.findActiveByProfileId(profileId);
  }

  async getPaymentMethodById(id: string) {
    const method = await this.paymentMethodRepo.findById(id);
    if (!method) {
      throw new NotFoundException("Payment method not found");
    }
    return method;
  }

  async createPaymentMethod(profileId: string, data: CreatePaymentMethodData) {
    if (!data.name || !data.type) {
      throw new BadRequestException("Name and type are required");
    }

    const count = await this.paymentMethodRepo.countByProfileId(profileId);

    const newMethod: NewPaymentMethod = {
      name: data.name,
      type: data.type as NewPaymentMethod["type"],
      profileId,
      instructions: data.instructions ?? null,
      details: data.details ?? null,
      isActive: data.isActive ?? false,
      displayOrder: data.displayOrder ?? count,
      metadata: data.metadata ?? null,
    };

    return await this.paymentMethodRepo.create(newMethod);
  }

  async updatePaymentMethod(id: string, data: UpdatePaymentMethodData) {
    const existing = await this.paymentMethodRepo.findById(id);
    if (!existing) {
      throw new NotFoundException("Payment method not found");
    }

    const updateData: Partial<PaymentMethod> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined)
      updateData.type = data.type as PaymentMethod["type"];
    if (data.instructions !== undefined)
      updateData.instructions = data.instructions;
    if (data.details !== undefined) updateData.details = data.details;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    return await this.paymentMethodRepo.update(id, updateData);
  }

  async deletePaymentMethod(id: string) {
    const existing = await this.paymentMethodRepo.findById(id);
    if (!existing) {
      throw new NotFoundException("Payment method not found");
    }

    await this.paymentMethodRepo.delete(id);
    return existing;
  }

  async togglePaymentMethod(id: string, isActive: boolean) {
    const existing = await this.paymentMethodRepo.findById(id);
    if (!existing) {
      throw new NotFoundException("Payment method not found");
    }

    return await this.paymentMethodRepo.update(id, { isActive });
  }

  async activatePaymentMethods(profileId: string, methodIds: string[]) {
    // Validate all methods belong to the profile
    for (const methodId of methodIds) {
      const method = await this.paymentMethodRepo.findById(methodId);
      if (!method) {
        throw new NotFoundException(`Payment method ${methodId} not found`);
      }
      if (method.profileId !== profileId) {
        throw new BadRequestException(
          "Payment method does not belong to this profile",
        );
      }
    }

    // Deactivate all methods first
    await this.paymentMethodRepo.deactivateAll(profileId);

    // Activate selected methods
    const updates = methodIds.map((methodId) =>
      this.paymentMethodRepo.update(methodId, { isActive: true }),
    );

    await Promise.all(updates);

    return this.paymentMethodRepo.findByProfileId(profileId);
  }

  async reorderPaymentMethods(profileId: string, methodIds: string[]) {
    // Validate all methods belong to the profile
    for (const methodId of methodIds) {
      const method = await this.paymentMethodRepo.findById(methodId);
      if (!method) {
        throw new NotFoundException(`Payment method ${methodId} not found`);
      }
      if (method.profileId !== profileId) {
        throw new BadRequestException(
          "Payment method does not belong to this profile",
        );
      }
    }

    return await this.paymentMethodRepo.reorder(profileId, methodIds);
  }

  async seedDefaultMethods(profileId: string) {
    // Check if profile already has payment methods
    const existingCount =
      await this.paymentMethodRepo.countByProfileId(profileId);
    if (existingCount > 0) {
      return this.getPaymentMethods(profileId);
    }

    // Default payment methods for Peru
    const defaultMethods: Array<Omit<NewPaymentMethod, "profileId">> = [
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
        instructions: "Pago móvil con Yape",
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
        instructions: "Pago móvil con Plin",
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

    return await this.paymentMethodRepo.createMany(profileId, defaultMethods);
  }
}
