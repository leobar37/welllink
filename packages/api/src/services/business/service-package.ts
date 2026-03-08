import { ServicePackageRepository } from "../repository/service-package";
import { ClientPackageRepository } from "../repository/client-package";
import type { ServicePackage, NewServicePackage } from "../../db/schema/service-package";

export interface CreateServicePackageInput {
  profileId: string;
  name: string;
  description?: string;
  price: string;
  totalSessions: number;
  discountPercent?: number;
  services?: string[];
  validityDays?: number;
}

export interface UpdateServicePackageInput {
  name?: string;
  description?: string;
  price?: string;
  totalSessions?: number;
  discountPercent?: number;
  services?: string[];
  validityDays?: number;
  isActive?: boolean;
}

export class ServicePackageService {
  constructor(
    private servicePackageRepo: ServicePackageRepository,
    private clientPackageRepo: ClientPackageRepository
  ) {}

  async createPackage(data: CreateServicePackageInput): Promise<ServicePackage> {
    const newPackage: NewServicePackage = {
      profileId: data.profileId,
      name: data.name,
      description: data.description,
      price: data.price,
      totalSessions: data.totalSessions,
      discountPercent: data.discountPercent,
      services: data.services || [],
      validityDays: data.validityDays,
      isActive: true,
    };

    return this.servicePackageRepo.create(newPackage);
  }

  async getPackageById(id: string): Promise<ServicePackage | null> {
    return this.servicePackageRepo.findById(id);
  }

  async getPackagesByProfile(profileId: string): Promise<ServicePackage[]> {
    return this.servicePackageRepo.findByProfileId(profileId);
  }

  async getActivePackagesByProfile(profileId: string): Promise<ServicePackage[]> {
    return this.servicePackageRepo.findActiveByProfileId(profileId);
  }

  async updatePackage(id: string, data: UpdateServicePackageInput): Promise<ServicePackage | null> {
    return this.servicePackageRepo.update(id, data);
  }

  async deletePackage(id: string): Promise<boolean> {
    // Check if there are any active client packages using this package
    const clientPackages = await this.clientPackageRepo.findByPackageId(id);
    const activePackages = clientPackages.filter(p => p.status === "active");
    
    if (activePackages.length > 0) {
      throw new Error("No se puede eliminar un paquete que tiene clientes activos");
    }
    
    return this.servicePackageRepo.delete(id);
  }

  async softDeletePackage(id: string): Promise<ServicePackage | null> {
    // Check if there are any active client packages using this package
    const clientPackages = await this.clientPackageRepo.findByPackageId(id);
    const activePackages = clientPackages.filter(p => p.status === "active");
    
    if (activePackages.length > 0) {
      throw new Error("No se puede desactivar un paquete que tiene clientes activos");
    }
    
    return this.servicePackageRepo.softDelete(id);
  }
}
