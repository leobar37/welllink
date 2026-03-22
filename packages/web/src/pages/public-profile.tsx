import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { api } from "@/lib/api";
import type { PublicProfileData } from "@/lib/types";
import { ProfileHeader } from "@/components/public-profile/profile-header";
import { SocialLinks } from "@/components/public-profile/social-links";
import { ActionButtons } from "@/components/public-profile/action-buttons";
import { FloatingActions } from "@/components/public-profile/floating-actions";
import { MedicalServices } from "@/components/public-profile/medical-services";
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider";
import { ChatWidget } from "@/components/chat";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <ProfileThemeProvider themeId={data.themeId}>
        <div className="text-foreground pb-24 flex-1">
          <main className="max-w-md mx-auto px-6 py-12 flex flex-col items-center space-y-8 animate-in fade-in duration-500">
            <ProfileHeader profile={data.profile} />

            <SocialLinks links={data.socialLinks} />

            <MedicalServices
              services={data.medicalServices || []}
              username={data.profile.username}
            />

            <ActionButtons
              features={data.features}
              whatsappNumber={data.profile.whatsappNumber}
              medicalServices={data.medicalServices || []}
            />
          </main>

          <FloatingActions
            username={data.profile.username}
            displayName={data.profile.displayName}
          />

          <ChatWidget
            profileId={data.profile.id}
            doctorName={data.profile.displayName}
          />
        </div>
      </ProfileThemeProvider>
    );
  }

  return (
    <ProfileThemeProvider themeId={data.themeId}>
      <div className="text-foreground flex-1 h-screen overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={70} minSize={50}>
            <main className="h-full overflow-y-auto px-6 py-10 flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ProfileHeader profile={data.profile} />

              <SocialLinks links={data.socialLinks} />

              <MedicalServices
                services={data.medicalServices || []}
                username={data.profile.username}
              />

              <ActionButtons
                features={data.features}
                whatsappNumber={data.profile.whatsappNumber}
                medicalServices={data.medicalServices || []}
              />

              {/* Footer spacing */}
              <div className="h-8" />
            </main>
          </ResizablePanel>

          <ResizableHandle className="w-1.5 bg-border/30 hover:bg-primary/40 transition-all duration-200 data-[resize-handle-active]:bg-primary/60" />

          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={45}
            className="h-full flex flex-col overflow-hidden"
          >
            <ChatWidget
              profileId={data.profile.id}
              doctorName={data.profile.displayName}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ProfileThemeProvider>
  );
}
