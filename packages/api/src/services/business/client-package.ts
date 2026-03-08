import { ClientPackageRepository } from "../repository/client-package";
import { ServicePackageRepository } from "../repository/service-package";
import { MembershipRepository } from "../repository/membership";
import { InventoryRepository } from "../repository/inventory";
import { ServiceProductRepository } from "../repository/service-product";
import type { ClientPackage, NewClientPackage, PurchaseType, ClientPackageStatus } from "../../db/schema/client-package";
import type { BillingPeriod } from "../../db/schema/membership";
import { BillingPeriod as BillingPeriodValue } from "../../db/schema/membership";
import { PurchaseType as PurchaseTypeValue, ClientPackageStatus as ClientPackageStatusValue } from "../../db/schema/client-package";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export interface PurchasePackageInput {
  profileId: string;
  clientId: string;
  packageId: string;
  pricePaid: string;
}

export interface PurchaseMembershipInput {
  profileId: string;
  clientId: string;
  membershipId: string;
  pricePaid: string;
  autoRenew?: boolean;
}

export interface RedeemSessionInput {
  clientPackageId: string;
  serviceId: string;
  staffId?: string;
}

function calculateValidityDays(billingPeriod: BillingPeriod): number {
  switch (billingPeriod) {
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    case "quarterly":
      return 90;
    case "yearly":
      return 365;
    default:
      return 30;
  }
}

function calculatePeriodEnd(billingPeriod: BillingPeriod, startDate: Date = new Date()): Date {
  switch (billingPeriod) {
    case "weekly":
      return addWeeks(startDate, 1);
    case "biweekly":
      return addWeeks(startDate, 2);
    case "monthly":
      return addMonths(startDate, 1);
    case "quarterly":
      return addMonths(startDate, 3);
    case "yearly":
      return addYears(startDate, 1);
    default:
      return addMonths(startDate, 1);
  }
}

export class ClientPackageService {
  constructor(
    private clientPackageRepo: ClientPackageRepository,
    private servicePackageRepo: ServicePackageRepository,
    private membershipRepo: MembershipRepository,
    private inventoryRepo: InventoryRepository,
    private serviceProductRepo: ServiceProductRepository
  ) {}

  async purchasePackage(data: PurchasePackageInput): Promise<ClientPackage> {
    // Verify package exists and is active
    const servicePackage = await this.servicePackageRepo.findById(data.packageId);
    if (!servicePackage) {
      throw new Error("Paquete no encontrado");
    }
    if (!servicePackage.isActive) {
      throw new Error("Paquete no disponible");
    }

    // Calculate expiration date if validityDays is set
    let expiresAt: Date | undefined;
    if (servicePackage.validityDays) {
      expiresAt = addDays(new Date(), servicePackage.validityDays);
    }

    const newClientPackage: NewClientPackage = {
      profileId: data.profileId,
      clientId: data.clientId,
      purchaseType: PurchaseTypeValue.PACKAGE,
      packageId: data.packageId,
      remainingSessions: servicePackage.totalSessions,
      totalSessions: servicePackage.totalSessions,
      pricePaid: data.pricePaid,
      status: ClientPackageStatusValue.ACTIVE,
      purchasedAt: new Date(),
      expiresAt,
      autoRenew: false,
    };

    return this.clientPackageRepo.create(newClientPackage);
  }

  async purchaseMembership(data: PurchaseMembershipInput): Promise<ClientPackage> {
    // Verify membership exists and is active
    const membership = await this.membershipRepo.findById(data.membershipId);
    if (!membership) {
      throw new Error("Membresía no encontrada");
    }
    if (!membership.isActive) {
      throw new Error("Membresía no disponible");
    }

    const now = new Date();
    const periodEnd = calculatePeriodEnd(membership.billingPeriod, now);

    const newClientPackage: NewClientPackage = {
      profileId: data.profileId,
      clientId: data.clientId,
      purchaseType: PurchaseTypeValue.MEMBERSHIP,
      membershipId: data.membershipId,
      remainingSessions: membership.includedSessions || 0,
      totalSessions: membership.includedSessions || 0,
      pricePaid: data.pricePaid,
      status: ClientPackageStatusValue.ACTIVE,
      purchasedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      autoRenew: data.autoRenew || false,
    };

    return this.clientPackageRepo.create(newClientPackage);
  }

  async getClientPackages(clientId: string): Promise<ClientPackage[]> {
    return this.clientPackageRepo.findByClientId(clientId);
  }

  async getActiveClientPackages(clientId: string): Promise<ClientPackage[]> {
    return this.clientPackageRepo.findActiveByClientId(clientId);
  }

  async getClientPackageById(id: string): Promise<ClientPackage | null> {
    return this.clientPackageRepo.findById(id);
  }

  async getClientPackagesByProfile(profileId: string): Promise<ClientPackage[]> {
    return this.clientPackageRepo.findByProfileId(profileId);
  }

  async redeemSession(clientPackageId: string): Promise<ClientPackage | null> {
    const clientPackage = await this.clientPackageRepo.findById(clientPackageId);
    if (!clientPackage) {
      throw new Error("Paquete del cliente no encontrado");
    }

    if (clientPackage.status !== ClientPackageStatusValue.ACTIVE) {
      throw new Error("El paquete no está activo");
    }

    // Check if expired
    if (clientPackage.expiresAt && new Date() > clientPackage.expiresAt) {
      await this.clientPackageRepo.expire(clientPackageId);
      throw new Error("El paquete ha expirado");
    }

    // Check if membership period has ended
    if (
      clientPackage.purchaseType === PurchaseTypeValue.MEMBERSHIP &&
      clientPackage.currentPeriodEnd &&
      new Date() > clientPackage.currentPeriodEnd
    ) {
      // Renew membership period
      const membership = await this.membershipRepo.findById(clientPackage.membershipId!);
      if (membership) {
        const now = new Date();
        const newPeriodEnd = calculatePeriodEnd(membership.billingPeriod, now);
        
        await this.clientPackageRepo.update(clientPackageId, {
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          remainingSessions: membership.includedSessions || 0,
          totalSessions: membership.includedSessions || 0,
        });
      }
    }

    // Check if there are remaining sessions
    if (clientPackage.remainingSessions <= 0) {
      throw new Error("No hay sesiones disponibles");
    }

    // Decrement sessions
    return this.clientPackageRepo.decrementSessions(clientPackageId);
  }

  async cancelPackage(clientPackageId: string): Promise<ClientPackage | null> {
    const clientPackage = await this.clientPackageRepo.findById(clientPackageId);
    if (!clientPackage) {
      throw new Error("Paquete del cliente no encontrado");
    }

    return this.clientPackageRepo.cancel(clientPackageId);
  }

  async getPackageDetails(clientPackageId: string) {
    const clientPackage = await this.clientPackageRepo.findById(clientPackageId);
    if (!clientPackage) {
      return null;
    }

    let packageDetails;
    if (clientPackage.purchaseType === PurchaseTypeValue.PACKAGE && clientPackage.packageId) {
      packageDetails = await this.servicePackageRepo.findById(clientPackage.packageId);
    } else if (clientPackage.purchaseType === PurchaseTypeValue.MEMBERSHIP && clientPackage.membershipId) {
      packageDetails = await this.membershipRepo.findById(clientPackage.membershipId);
    }

    return {
      clientPackage,
      packageDetails,
    };
  }
}
