import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useProfile } from "@/hooks/use-profile";
import {
  RecommendationsView,
  useGenerateRecommendations,
  exportRecommendationsToPdf,
} from "@/features/recommendations";

type SurveyDetail = {
  id: string;
  visitorName?: string | null;
  visitorWhatsapp?: string | null;
  createdAt: string;
};

export default function SurveyRecommendationsRoute() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { profile, isLoading: isLoadingProfile } = useProfile();

  // Fetch survey details
  const { data: survey, isLoading: isLoadingSurvey } = useQuery<SurveyDetail>({
    queryKey: ["survey", surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error("No survey ID");
      const { data, error } = await api.api["health-survey"][":id"].get({
        params: { id: surveyId },
      });
      if (error) throw error;
      return data as SurveyDetail;
    },
    enabled: !!surveyId,
  });

  // AI Recommendations hook - only valid when we have both IDs
  const {
    recommendations,
    generate,
    isLoading: isGenerating,
    stop,
    error: generateError,
  } = useGenerateRecommendations({
    surveyResponseId: surveyId || "",
    profileId: profile?.id || "",
    onFinish: (result) => {
      console.log("Recommendations generated:", result);
    },
    onError: (error) => {
      console.error("Error generating recommendations:", error);
    },
  });

  const handleExportPdf = async () => {
    if (!recommendations?.clientRecommendations) return;

    await exportRecommendationsToPdf({
      data: recommendations.clientRecommendations,
      clientName: survey?.visitorName || "Cliente",
      advisorName: profile?.displayName || undefined,
    });
  };

  // Safe generate that checks prerequisites
  const handleGenerate = () => {
    console.log("handleGenerate called", { surveyId, profileId: profile?.id });
    if (!surveyId || !profile?.id) {
      console.error("Missing surveyId or profileId", { surveyId, profileId: profile?.id });
      return;
    }
    console.log("Calling generate...");
    generate();
  };

  console.log("SurveyRecommendationsRoute render", {
    surveyId,
    profileId: profile?.id,
    isLoadingSurvey,
    isLoadingProfile,
    survey,
    isGenerating,
  });

  // Show loading while profile or survey loads
  if (isLoadingSurvey || isLoadingProfile) {
    console.log("Showing loading state");
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if generation failed
  if (generateError) {
    console.error("Generation error:", generateError);
  }

  console.log("Rendering main content with handleGenerate:", typeof handleGenerate);

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard/surveys")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a encuestas
      </Button>

      {/* Main Content */}
      <RecommendationsView
        recommendations={recommendations || undefined}
        isLoading={isGenerating}
        onGenerate={handleGenerate}
        onStop={stop}
        onExportPdf={handleExportPdf}
        clientName={survey?.visitorName || "Cliente"}
      />
    </div>
  );
}
