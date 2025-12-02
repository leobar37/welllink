import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { api } from "@/lib/api";
import type { Feature, TuHistoriaFeature } from "@/lib/types";
import { TuHistoriaViewer } from "@/components/public-profile/tu-historia-viewer";
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicStoriesRoute() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      if (!username) throw new Error("Username requerido");
      const { data, error } = await api.api.public.profiles[username].get();
      if (error) throw error;
      return data as { profile: { id: string; displayName: string }; features: Feature[]; themeId?: string };
    },
    enabled: !!username,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <EmptyState
        title="Perfil no disponible"
        description="No pudimos encontrar este perfil."
        onBack={() => navigate(-1)}
      />
    );
  }

  const storyFeature = data.features.find(
    (feature) => feature.type === "tu-historia",
  ) as TuHistoriaFeature | undefined;

  if (
    !storyFeature ||
    !storyFeature.isEnabled ||
    !storyFeature.config.section ||
    !storyFeature.config.stories.length
  ) {
    return (
      <EmptyState
        title="Sin historias"
        description="Este asesor aún no comparte su historia."
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <ProfileThemeProvider themeId={data.themeId}>
      <TuHistoriaViewer
        profileId={data.profile.id}
        profileName={data.profile.displayName}
        section={storyFeature.config.section}
        stories={storyFeature.config.stories}
        onBack={() => navigate(-1)}
      />
    </ProfileThemeProvider>
  );
}

function EmptyState({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={onBack}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
