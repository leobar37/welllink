import { useState, useEffect, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { aiResponseSchema, type AIResponse } from "../schema";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5300";

interface UseGenerateRecommendationsOptions {
  surveyResponseId: string;
  profileId: string;
  onFinish?: (object: AIResponse) => void;
  onError?: (error: Error) => void;
}

// Save recommendations to the database
async function saveRecommendations(
  surveyResponseId: string,
  profileId: string,
  data: AIResponse,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/ai-recommendations/save/${surveyResponseId}?profileId=${profileId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        clientRecommendations: data.clientRecommendations,
        advisorNotes: data.advisorNotes,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save recommendations");
  }
}

// Load existing recommendations from the database
async function loadRecommendations(
  surveyResponseId: string,
): Promise<AIResponse | null> {
  const response = await fetch(
    `${API_BASE}/api/ai-recommendations/survey/${surveyResponseId}`,
    {
      credentials: "include",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load recommendations");
  }

  const data = await response.json();
  return {
    clientRecommendations: data.recommendations,
    advisorNotes: data.advisorNotes,
  };
}

export function useGenerateRecommendations({
  surveyResponseId,
  profileId,
  onFinish,
  onError,
}: UseGenerateRecommendationsOptions) {
  const [savedRecommendations, setSavedRecommendations] =
    useState<AIResponse | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Load existing recommendations on mount
  useEffect(() => {
    if (!surveyResponseId) {
      setIsLoadingExisting(false);
      return;
    }

    loadRecommendations(surveyResponseId)
      .then((data) => {
        if (data) {
          setSavedRecommendations(data);
        }
      })
      .catch((err) => {
        console.error("Error loading existing recommendations:", err);
      })
      .finally(() => {
        setIsLoadingExisting(false);
      });
  }, [surveyResponseId]);

  const handleFinish = useCallback(
    async (event: { object?: AIResponse }) => {
      if (event.object) {
        // Save to database
        try {
          await saveRecommendations(surveyResponseId, profileId, event.object);
          setSavedRecommendations(event.object);
          console.log("Recommendations saved successfully");
        } catch (err) {
          console.error("Error saving recommendations:", err);
        }

        if (onFinish) {
          onFinish(event.object);
        }
      }
    },
    [surveyResponseId, profileId, onFinish],
  );

  const { object, submit, isLoading, stop, error } = useObject({
    api: `${API_BASE}/api/ai-recommendations/generate/${surveyResponseId}/stream?profileId=${profileId}`,
    schema: aiResponseSchema,
    credentials: "include",
    onFinish: handleFinish,
    onError: (err) => {
      if (onError) {
        onError(err);
      }
    },
  });

  const generate = () => {
    console.log("useGenerateRecommendations.generate() called", {
      surveyResponseId,
      profileId,
    });
    submit({});
  };

  // Use streaming object while generating, otherwise use saved
  const recommendations = object || savedRecommendations;

  return {
    recommendations,
    clientRecommendations: recommendations?.clientRecommendations,
    advisorNotes: recommendations?.advisorNotes,
    generate,
    isLoading: isLoading || isLoadingExisting,
    isLoadingExisting,
    stop,
    error,
  };
}
