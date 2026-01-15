import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api } from "@/lib/api";
import { useAssetUrl } from "@/hooks/use-asset-url";
import { formatDuration, formatPrice } from "@/components/medical-services/utils/formatters";
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MedicalService, PublicProfileData } from "@/lib/types";

interface ProfileDataWithServices extends PublicProfileData {
  medicalServices: MedicalService[];
}

export default function PublicServiceDetailRoute() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const [service, setService] = useState<MedicalService | null>(null);
  const [profileData, setProfileData] = useState<ProfileDataWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchService() {
      if (!username || !id) return;

      try {
        setLoading(true);

        // Fetch profile data to get theme and verify service belongs to profile
        const { data: pData, error: pError } = await api.api.public.profiles[username].get();
        if (pError) throw new Error(pError.value ? String(pError.value) : "Error fetching profile");

        const profileDataWithServices = pData as ProfileDataWithServices;

        // Find the service in the profile's medical services
        const foundService = profileDataWithServices.medicalServices?.find((s: MedicalService) => s.id === id);

        if (!foundService) {
          throw new Error("Servicio no encontrado");
        }

        setService(foundService);
        setProfileData(profileDataWithServices);
      } catch (err) {
        console.error(err);
        setError("No pudimos encontrar este servicio.");
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [username, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="max-w-2xl mx-auto w-full px-6 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !service || !profileData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Servicio no encontrado</h1>
        <p className="text-muted-foreground mb-4">
          {error || "El servicio que buscas no existe."}
        </p>
        <Button asChild variant="outline">
          <Link to={`/${username}`}>Volver al perfil</Link>
        </Button>
      </div>
    );
  }

  return (
    <ProfileThemeProvider themeId={profileData.themeId}>
      <ServiceDetailContent service={service} username={username} profileData={profileData} />
    </ProfileThemeProvider>
  );
}

interface ServiceDetailContentProps {
  service: MedicalService;
  username: string;
  profileData: ProfileDataWithServices;
}

function ServiceDetailContent({ service, username, profileData }: ServiceDetailContentProps) {
  const { data: imageUrl } = useAssetUrl(service.imageAssetId || undefined);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Back Button */}
        <Link
          to={`/${username}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Link>

        {/* Service Image */}
        {imageUrl ? (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted shadow-sm">
            <img
              src={imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <Stethoscope className="h-24 w-24 text-primary/30" />
          </div>
        )}

        {/* Service Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm">
              {formatDuration(service.duration)}
            </Badge>
            {service.price && (
              <Badge variant="outline" className="text-sm font-semibold">
                {formatPrice(service.price)}
              </Badge>
            )}
            {service.category && (
              <Badge variant="outline">{service.category}</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Descripción</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {service.description}
            </p>
          </section>
        )}

        {/* Requirements */}
        {service.requirements && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Requisitos</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {service.requirements}
            </p>
          </section>
        )}

        {/* CTA - Contact via WhatsApp */}
        {profileData?.profile?.whatsappNumber && (
          <section className="pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto"
            >
              <a
                href={`https://wa.me/${profileData.profile.whatsappNumber}?text=${encodeURIComponent(`Hola, me interesa el servicio "${service.name}"`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reservar por WhatsApp
              </a>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
