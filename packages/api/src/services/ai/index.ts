import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiResponseSchema } from "./schema";
import { buildRecommendationsPrompt } from "./prompt";
import type { HealthSurveyResponseData } from "../../db/schema/health-survey";

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
 */
export function generateRecommendationsStream(
  params: GenerateRecommendationsParams,
) {
  const prompt = buildRecommendationsPrompt(params);

  // streamObject returns synchronously - no await needed
  const result = streamObject({
    model: openai("gpt-4o"),
    schema: aiResponseSchema,
    prompt,
  });

  return result;
}

/**
 * Generate recommendations and wait for the complete result.
 * Use this when you need the full object (not streaming).
 */
export async function generateRecommendations(
  params: GenerateRecommendationsParams,
) {
  const prompt = buildRecommendationsPrompt(params);

  // streamObject returns synchronously
  const result = streamObject({
    model: openai("gpt-4o"),
    schema: aiResponseSchema,
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
