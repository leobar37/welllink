import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { HealthSurveyRepository } from "../repository/health-survey";
import type { HealthSurveyResponse } from "../../db/schema/health-survey";

interface CreateSurveyData {
  profileId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorWhatsapp?: string;
  referredBy?: string;
  responses: Record<string, unknown>;
}

export class HealthSurveyService {
  constructor(private healthSurveyRepository: HealthSurveyRepository) {}

  async getSurveyResponses(profileId: string): Promise<HealthSurveyResponse[]> {
    return this.healthSurveyRepository.findByProfile(profileId);
  }

  async getSurveyResponse(id: string): Promise<HealthSurveyResponse> {
    const response = await this.healthSurveyRepository.findOne(id);
    if (!response) {
      throw new NotFoundException("Survey response not found");
    }
    return response;
  }

  async getLatestResponse(profileId: string): Promise<HealthSurveyResponse> {
    const response = await this.healthSurveyRepository.findLatest(profileId);
    if (!response) {
      throw new NotFoundException("No survey response found");
    }
    return response;
  }

  async createSurveyResponse(data: CreateSurveyData) {
    if (!data.profileId) {
      throw new BadRequestException("Profile ID is required");
    }

    if (!data.visitorName) {
      throw new BadRequestException("Visitor name is required");
    }

    if (!data.responses || typeof data.responses !== "object") {
      throw new BadRequestException("Responses field is required");
    }

    return this.healthSurveyRepository.create({
      profileId: data.profileId,
      visitorName: data.visitorName,
      visitorPhone: data.visitorPhone,
      visitorEmail: data.visitorEmail,
      visitorWhatsapp: data.visitorWhatsapp,
      referredBy: data.referredBy,
      responses: data.responses,
    });
  }

  async updateSurveyResponse(
    id: string,
    profileId: string,
    data: Partial<CreateSurveyData>
  ) {
    const existingResponse =
      await this.healthSurveyRepository.findOneByProfile(id, profileId);
    if (!existingResponse) {
      throw new NotFoundException("Survey response not found");
    }

    return this.healthSurveyRepository.update(id, profileId, data);
  }

  async deleteSurveyResponse(id: string, profileId: string) {
    const response = await this.healthSurveyRepository.findOneByProfile(
      id,
      profileId
    );
    if (!response) {
      throw new NotFoundException("Survey response not found");
    }

    return this.healthSurveyRepository.delete(id, profileId);
  }

  async getSurveyStats(profileId: string) {
    const responses =
      await this.healthSurveyRepository.findByProfile(profileId);

    if (responses.length === 0) {
      return {
        totalResponses: 0,
        latestResponseDate: null,
      };
    }

    return {
      totalResponses: responses.length,
      latestResponseDate: responses[0]?.createdAt || null,
    };
  }

  async getResponsesByDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.healthSurveyRepository.findByDateRange(
      profileId,
      startDate,
      endDate
    );
  }
}
