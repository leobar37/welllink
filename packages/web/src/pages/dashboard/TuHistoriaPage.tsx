import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { TuHistoriaContent } from "@/components/dashboard/tu-historia/TuHistoriaContent";
import { useProfile } from "@/hooks/use-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface FeaturesConfig {
  tuHistoria?: {
    enabled: boolean;
    buttonText: string;
  };
}

interface ProfileWithFeatures {
  id: string;
  featuresConfig?: FeaturesConfig;
}

export function TuHistoriaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile: rawProfile, isLoading } = useProfile();
  const profile = rawProfile as ProfileWithFeatures | undefined;

  // Get features config from profile
  const featuresConfig = profile?.featuresConfig || {};
  const tuHistoriaConfig = featuresConfig.tuHistoria || {
    enabled: false,
    buttonText: "Mi historia",
  };

  // Mutation for updating button text
  const updateButtonText = useMutation({
    mutationFn: async (text: string) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } = await api.profiles[profile.id][
        "features-config"
      ].patch({
        tuHistoria: {
          ...tuHistoriaConfig,
          buttonText: text,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Error al actualizar el texto del botón");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/features")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi historia</h1>
            <p className="text-muted-foreground">
              Comparte historias visuales con antes/después y un CTA personalizado.
            </p>
          </div>
        </div>
      </div>

      {/* Tu Historia content without modal wrapper */}
      <TuHistoriaContent
        profileId={profile?.id}
        profile={profile}
        buttonText={tuHistoriaConfig.buttonText}
        onUpdateButtonText={async (text) => {
          return updateButtonText.mutateAsync(text);
        }}
        isSavingButtonText={updateButtonText.isPending}
      />
    </div>
  );
}