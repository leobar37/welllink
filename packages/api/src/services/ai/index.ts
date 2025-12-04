import { streamObject } from "ai";
import { fireworks } from "@ai-sdk/fireworks";
import { aiResponseSchema } from "./schema";
import { buildRecommendationsPrompt } from "./prompt";
import type { HealthSurveyResponseData } from "../../db/schema/health-survey";

/**
 * AI Model Configuration
 * Change this constant to switch models across all AI functions
 */
// DeepSeek V3 - Good balance of quality and cost
export const AI_MODEL = "accounts/fireworks/models/deepseek-v3p1-terminus";

interface GenerateRecommendationsParams {
  visitorName: string;
  responses: HealthSurveyResponseData;
}

/**
 * Generate recommendations with streaming support.
 * Returns the streamObject result which can be used for streaming responses.
 *
 * Note: streamObject() returns synchronously, but its properties (.object, .usage, etc.)
 * are Promises that resolve when the stream completes.
 *
 * Uses DeepSeek V3 serverless model for Herbalife wellness recommendations.
 */
export function generateRecommendationsStream(
  params: GenerateRecommendationsParams,
) {
  const prompt = buildRecommendationsPrompt(params);

  // streamObject returns synchronously - no await needed
  // Using mode: "tool" for better schema enforcement via function calling
  const result = streamObject({
    model: fireworks(AI_MODEL),
    schema: aiResponseSchema,
    schemaName: "HerbalifeRecommendations",
    schemaDescription: "Recomendaciones personalizadas de Herbalife con estructura JSON específica",
    mode: "tool",
    prompt,
  });

  return result;
}

/**
 * Generate recommendations and wait for the complete result.
 * Use this when you need the full object (not streaming).
 *
 * Uses DeepSeek V3 serverless model for Herbalife wellness recommendations.
 */
export async function generateRecommendations(
  params: GenerateRecommendationsParams,
) {
  const prompt = buildRecommendationsPrompt(params);

  // streamObject returns synchronously
  // Using mode: "tool" for better schema enforcement via function calling
  const result = streamObject({
    model: fireworks(AI_MODEL),
    schema: aiResponseSchema,
    schemaName: "HerbalifeRecommendations",
    schemaDescription: "Recomendaciones personalizadas de Herbalife con estructura JSON específica",
    mode: "tool",
    prompt,
  });

  // Wait for the complete object - .object is a Promise
  const finalObject = await result.object;

  return {
    object: finalObject,
    usage: await result.usage,
  };
}

export {
  aiResponseSchema,
  clientRecommendationsSchema,
  advisorNotesSchema,
} from "./schema";
export type {
  ClientRecommendationsType,
  AdvisorNotesType,
  AIResponseType,
} from "./schema";
