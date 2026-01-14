import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { MedicalServicesCatalog } from "@/components/medical-services/medical-services-catalog";

export function MedicalServicesPage() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No se encontró el perfil</p>
      </div>
    );
  }

  return <MedicalServicesCatalog profileId={profile.id} />;
}
