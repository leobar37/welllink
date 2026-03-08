import { MembershipRepository } from "../repository/membership";
import { ClientPackageRepository } from "../repository/client-package";
import type { Membership, NewMembership } from "../../db/schema/membership";
import { BillingPeriod } from "../../db/schema/membership";

export interface CreateMembershipInput {
  profileId: string;
  name: string;
  description?: string;
  price: string;
  billingPeriod: BillingPeriod;
  benefits?: string[];
  includedSessions?: number;
  discountPercent?: number;
  unlimitedSessions?: boolean;
}

export interface UpdateMembershipInput {
  name?: string;
  description?: string;
  price?: string;
  billingPeriod?: BillingPeriod;
  benefits?: string[];
  includedSessions?: number;
  discountPercent?: number;
  unlimitedSessions?: boolean;
  isActive?: boolean;
}

export class MembershipService {
  constructor(
    private membershipRepo: MembershipRepository,
    private clientPackageRepo: ClientPackageRepository
  ) {}

  async createMembership(data: CreateMembershipInput): Promise<Membership> {
    const newMembership: NewMembership = {
      profileId: data.profileId,
      name: data.name,
      description: data.description,
      price: data.price,
      billingPeriod: data.billingPeriod,
      benefits: data.benefits || [],
      includedSessions: data.includedSessions,
      discountPercent: data.discountPercent,
      unlimitedSessions: data.unlimitedSessions || false,
      isActive: true,
    };

    return this.membershipRepo.create(newMembership);
  }

  async getMembershipById(id: string): Promise<Membership | null> {
    return this.membershipRepo.findById(id);
  }

  async getMembershipsByProfile(profileId: string): Promise<Membership[]> {
    return this.membershipRepo.findByProfileId(profileId);
  }

  async getActiveMembershipsByProfile(profileId: string): Promise<Membership[]> {
    return this.membershipRepo.findActiveByProfileId(profileId);
  }

  async updateMembership(id: string, data: UpdateMembershipInput): Promise<Membership | null> {
    return this.membershipRepo.update(id, data);
  }

  async deleteMembership(id: string): Promise<boolean> {
    // Check if there are any active client memberships using this membership
    const clientMemberships = await this.clientPackageRepo.findByMembershipId(id);
    const activeMemberships = clientMemberships.filter(m => m.status === "active");
    
    if (activeMemberships.length > 0) {
      throw new Error("No se puede eliminar una membresía que tiene clientes activos");
    }
    
    return this.membershipRepo.delete(id);
  }

  async softDeleteMembership(id: string): Promise<Membership | null> {
    // Check if there are any active client memberships using this membership
    const clientMemberships = await this.clientPackageRepo.findByMembershipId(id);
    const activeMemberships = clientMemberships.filter(m => m.status === "active");
    
    if (activeMemberships.length > 0) {
      throw new Error("No se puede desactivar una membresía que tiene clientes activos");
    }
    
    return this.membershipRepo.softDelete(id);
  }
}
