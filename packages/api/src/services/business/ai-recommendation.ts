import { NotFoundException } from "../../utils/http-exceptions";
import { AIRecommendationRepository } from "../repository/ai-recommendation";
import type {
  AIRecommendation,
  ClientRecommendations,
  AdvisorNotes,
} from "../../db/schema/ai-recommendation";

// health-survey: REMOVED - legacy wellness feature
// AIRecommendationService no longer depends on healthSurveyRepository

interface CreateRecommendationData {
  profileId: string;
  // surveyResponseId: REMOVED - no longer needed
  recommendations: ClientRecommendations;
  advisorNotes: AdvisorNotes;
  aiModel: string;
  aiVersion?: string;
  processingTimeMs?: number;
}

export class AIRecommendationService {
  constructor(
    private aiRecommendationRepository: AIRecommendationRepository,
    // healthSurveyRepository: REMOVED
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
    profileId: string,
  ): Promise<AIRecommendation> {
    const recommendation =
      await this.aiRecommendationRepository.findOneByProfile(id, profileId);
    if (!recommendation) {
      throw new NotFoundException("Recommendation not found");
    }
    return recommendation;
  }

  // getRecommendationBySurvey: REMOVED - was tied to health_survey_response

  async getLatestRecommendation(profileId: string): Promise<AIRecommendation> {
    const recommendation =
      await this.aiRecommendationRepository.findLatestByProfile(profileId);
    if (!recommendation) {
      throw new NotFoundException("No recommendation found");
    }
    return recommendation;
  }

  async createRecommendation(data: CreateRecommendationData) {
    // surveyResponseId validation: REMOVED

    return this.aiRecommendationRepository.create({
      profileId: data.profileId,
      // surveyResponseId: REMOVED - column removed from schema
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
    data: Partial<CreateRecommendationData>,
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
