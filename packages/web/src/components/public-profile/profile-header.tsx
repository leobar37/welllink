import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin, Phone, Mail, Globe, Building2 } from "lucide-react";
import type { Profile } from "@/lib/types";

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  const isOrganization = profile.isOrganization ?? false;

  const initials = profile.displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Construir URL absoluta del avatar
  const API_URL = import.meta.env.VITE_API_URL || "";
  const avatarUrl = profile.avatarUrl
    ? `${API_URL}${profile.avatarUrl}`
    : undefined;

  // Mostrar title o clinicName según el tipo
  const displayTitle = isOrganization
    ? profile.clinicName || profile.title
    : profile.title;

  return (
    <>
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar
          className="h-28 w-28 border-4 border-background shadow-xl cursor-pointer transition-transform hover:scale-105"
          onClick={() => avatarUrl && setIsImageOpen(true)}
        >
          <AvatarImage src={avatarUrl} alt={profile.displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.displayName}
          </h1>
          {displayTitle && (
            <p className="text-muted-foreground font-medium">{displayTitle}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Clinic/Organization Info */}
          {isOrganization &&
            (profile.clinicAddress ||
              profile.clinicPhone ||
              profile.clinicEmail ||
              profile.clinicWebsite) && (
              <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-border/50">
                {profile.clinicAddress && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.clinicAddress}</span>
                  </div>
                )}
                {profile.clinicPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{profile.clinicPhone}</span>
                  </div>
                )}
                {profile.clinicEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.clinicEmail}</span>
                  </div>
                )}
                {profile.clinicWebsite && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{profile.clinicWebsite}</span>
                  </div>
                )}
                {isOrganization && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
                    <Building2 className="h-3 w-3" />
                    <span>Clínica verificada</span>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent
          className="max-w-4xl w-[95vw] h-auto p-0 bg-transparent border-0 shadow-none"
          showCloseButton={false}
        >
          <div className="relative w-full">
            <img
              src={avatarUrl}
              alt={profile.displayName}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              onClick={() => setIsImageOpen(false)}
            />
            <button
              onClick={() => setIsImageOpen(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
