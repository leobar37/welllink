import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { AIRecommendationRepository } from "../repository/ai-recommendation";
import { HealthSurveyRepository } from "../repository/health-survey";
import type {
  AIRecommendation,
  ClientRecommendations,
  AdvisorNotes,
} from "../../db/schema/ai-recommendation";

interface CreateRecommendationData {
  profileId: string;
  surveyResponseId: string;
  recommendations: ClientRecommendations;
  advisorNotes: AdvisorNotes;
  aiModel: string;
  aiVersion?: string;
  processingTimeMs?: number;
}

export class AIRecommendationService {
  constructor(
    private aiRecommendationRepository: AIRecommendationRepository,
    private healthSurveyRepository: HealthSurveyRepository
  ) {}

  async getRecommendations(profileId: string): Promise<AIRecommendation[]> {
    return this.aiRecommendationRepository.findByProfile(profileId);
  }

  async getRecommendation(id: string): Promise<AIRecommendation> {
    const recommendation = await this.aiRecommendationRepository.findOne(id);
    if (!recommendation) {
      throw new NotFoundException("Recommendation not found");
    }
    return recommendation;
  }

  async getRecommendationByProfile(
    id: string,
    profileId: string
  ): Promise<AIRecommendation> {
    const recommendation =
      await this.aiRecommendationRepository.findOneByProfile(id, profileId);
    if (!recommendation) {
      throw new NotFoundException("Recommendation not found");
    }
    return recommendation;
  }

  async getRecommendationBySurvey(
    surveyResponseId: string
  ): Promise<AIRecommendation | null> {
    return this.aiRecommendationRepository.findBySurveyResponse(
      surveyResponseId
    );
  }

  async getLatestRecommendation(profileId: string): Promise<AIRecommendation> {
    const recommendation =
      await this.aiRecommendationRepository.findLatestByProfile(profileId);
    if (!recommendation) {
      throw new NotFoundException("No recommendation found");
    }
    return recommendation;
  }

  async createRecommendation(data: CreateRecommendationData) {
    if (!data.profileId) {
      throw new BadRequestException("Profile ID is required");
    }

    if (!data.surveyResponseId) {
      throw new BadRequestException("Survey response ID is required");
    }

    // Verify survey response exists and belongs to profile
    const surveyResponse = await this.healthSurveyRepository.findOneByProfile(
      data.surveyResponseId,
      data.profileId
    );
    if (!surveyResponse) {
      throw new NotFoundException("Survey response not found");
    }

    // Check if recommendation already exists for this survey
    const existingRecommendation =
      await this.aiRecommendationRepository.findBySurveyResponse(
        data.surveyResponseId
      );
    if (existingRecommendation) {
      // Update existing recommendation
      return this.aiRecommendationRepository.update(
        existingRecommendation.id,
        data.profileId,
        {
          recommendations: data.recommendations,
          advisorNotes: data.advisorNotes,
          aiModel: data.aiModel,
          aiVersion: data.aiVersion,
          processingTimeMs: data.processingTimeMs,
        }
      );
    }

    return this.aiRecommendationRepository.create({
      profileId: data.profileId,
      surveyResponseId: data.surveyResponseId,
      recommendations: data.recommendations,
      advisorNotes: data.advisorNotes,
      aiModel: data.aiModel,
      aiVersion: data.aiVersion,
      processingTimeMs: data.processingTimeMs,
    });
  }

  async updateRecommendation(
    id: string,
    profileId: string,
    data: Partial<CreateRecommendationData>
  ) {
    const existingRecommendation =
      await this.aiRecommendationRepository.findOneByProfile(id, profileId);
    if (!existingRecommendation) {
      throw new NotFoundException("Recommendation not found");
    }

    return this.aiRecommendationRepository.update(id, profileId, data);
  }

  async deleteRecommendation(id: string, profileId: string) {
    const recommendation =
      await this.aiRecommendationRepository.findOneByProfile(id, profileId);
    if (!recommendation) {
      throw new NotFoundException("Recommendation not found");
    }

    return this.aiRecommendationRepository.delete(id, profileId);
  }

  async getRecommendationStats(profileId: string) {
    const count =
      await this.aiRecommendationRepository.countByProfile(profileId);
    const latest =
      await this.aiRecommendationRepository.findLatestByProfile(profileId);

    return {
      totalRecommendations: count,
      latestRecommendationDate: latest?.createdAt || null,
    };
  }
}
