import { MedicalServiceRepository } from "../repository/medical-service";
import { AssetRepository } from "../repository/asset";
import type {
  MedicalService,
  NewMedicalService,
} from "../../db/schema/medical-service";

export class MedicalServiceBusinessService {
  constructor(
    private medicalServiceRepo: MedicalServiceRepository,
    private assetRepo: AssetRepository,
  ) {}

  async getServicesByProfile(profileId: string) {
    return await this.medicalServiceRepo.findByProfileId(profileId);
  }

  async getActiveServicesByProfile(profileId: string) {
    return await this.medicalServiceRepo.findActiveByProfileId(profileId);
  }

  async getServiceById(id: string) {
    return await this.medicalServiceRepo.findById(id);
  }

  async createService(
    profileId: string,
    data: Omit<NewMedicalService, "profileId">,
  ) {
    const newService: NewMedicalService = {
      ...data,
      profileId,
    };

    return await this.medicalServiceRepo.create(newService);
  }

  async updateService(id: string, data: Partial<MedicalService>) {
    return await this.medicalServiceRepo.update(id, data);
  }

  async deleteService(id: string) {
    await this.medicalServiceRepo.delete(id);
  }

  async updateServiceImage(serviceId: string, assetId: string) {
    return await this.medicalServiceRepo.update(serviceId, {
      imageAssetId: assetId,
    });
  }
}
