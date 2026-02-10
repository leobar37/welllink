import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BookingFlow } from "@/components/booking";
import { usePublicServices } from "@/hooks/use-booking";
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider";

export default function BookingRoute() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: services, isLoading: servicesLoading } = usePublicServices(
    username || "",
  );

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return;

      try {
        setLoading(true);
        const { data, error: profileError } =
          await api.api.public.profiles[username].get();
        if (profileError)
          throw new Error(
            profileError.value
              ? String(profileError.value)
              : "Error fetching profile",
          );

        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError("No pudimos cargar el perfil");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  const handleBookingComplete = () => {
    navigate(`/${username}?booking=success`);
  };

  if (loading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-muted-foreground mb-4">
          {error || "El perfil que buscas no existe."}
        </p>
        <Button asChild variant="outline">
          <Link to={`/${username}`}>Volver al perfil</Link>
        </Button>
      </div>
    );
  }

  return (
    <ProfileThemeProvider themeId={profileData.themeId}>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Link
            to={`/${username}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al perfil
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reservar Cita</h1>
            <p className="text-muted-foreground">
              Selecciona un servicio y horario para tu cita con{" "}
              {profileData.profile.displayName}
            </p>
          </div>

          {services && services.length > 0 ? (
            <BookingFlow
              username={username || ""}
              profileId={profileData.profile.id}
              services={services}
              onBookingComplete={handleBookingComplete}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No hay servicios disponibles para reservar
            </div>
          )}
        </div>
      </div>
    </ProfileThemeProvider>
  );
}
