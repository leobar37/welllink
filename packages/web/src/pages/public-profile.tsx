import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { api } from "@/lib/api";
import type { PublicProfileData } from "@/lib/types";
import { ProfileHeader } from "@/components/public-profile/profile-header";
import { SocialLinks } from "@/components/public-profile/social-links";
import { ActionButtons } from "@/components/public-profile/action-buttons";
import { FloatingActions } from "@/components/public-profile/floating-actions";
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return;

      try {
        setLoading(true);
        const { data: profileData, error } =
          await api.api.public.profiles[username].get();

        if (error) {
          throw new Error(
            error.value ? String(error.value) : "Error fetching profile",
          );
        }

        if (!profileData) {
          throw new Error("Profile not found");
        }

        // The API returns exactly what we need, matching PublicProfileData structure
        setData(profileData as unknown as PublicProfileData);
      } catch (err) {
        console.error(err);
        setError("No pudimos encontrar este perfil.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8 max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-4 w-full">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="w-full space-y-3">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-muted-foreground">
          {error || "El perfil que buscas no existe."}
        </p>
      </div>
    );
  }

  return (
    <ProfileThemeProvider themeId={data.themeId}>
      <div className="text-foreground pb-24 flex-1">
        <main className="max-w-md mx-auto px-6 py-12 flex flex-col items-center space-y-8 animate-in fade-in duration-500">
          <ProfileHeader profile={data.profile} />

          <SocialLinks links={data.socialLinks} />

          <ActionButtons
            features={data.features}
            whatsappNumber={data.profile.whatsappNumber}
          />
        </main>

        <FloatingActions
          username={data.profile.username}
          displayName={data.profile.displayName}
        />
      </div>
    </ProfileThemeProvider>
  );
}
