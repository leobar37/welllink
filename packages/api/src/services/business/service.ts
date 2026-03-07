import { ServiceRepository } from "../repository/service";
import { AssetRepository } from "../repository/asset";
import type {
  Service,
  NewService,
} from "../../db/schema/service";

export class ServiceBusinessService {
  constructor(
    private serviceRepo: ServiceRepository,
    private assetRepo: AssetRepository,
  ) {}

  async getServicesByProfile(profileId: string) {
    return await this.serviceRepo.findByProfileId(profileId);
  }

  async getActiveServicesByProfile(profileId: string) {
    return await this.serviceRepo.findActiveByProfileId(profileId);
  }

  async getServiceById(id: string) {
    return await this.serviceRepo.findById(id);
  }

  async createService(
    profileId: string,
    data: Omit<NewService, "profileId">,
  ) {
    const newService: NewService = {
      ...data,
      profileId,
    };

    return await this.serviceRepo.create(newService);
  }

  async updateService(id: string, data: Partial<Service>) {
    return await this.serviceRepo.update(id, data);
  }

  async deleteService(id: string) {
    await this.serviceRepo.delete(id);
  }

  async updateServiceImage(serviceId: string, assetId: string) {
    return await this.serviceRepo.update(serviceId, {
      imageAssetId: assetId,
    });
  }
}
