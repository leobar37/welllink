import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatPrice,
} from "@/components/medical-services/utils/formatters";
import { useAssetUrl } from "@/hooks/use-asset-url";
import type { MedicalService } from "@/lib/types";
import { Stethoscope } from "lucide-react";

interface MedicalServicesProps {
  services: MedicalService[];
  username: string;
}

export function MedicalServices({ services, username }: MedicalServicesProps) {
  if (!services.length) return null;

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} username={username} />
        ))}
      </div>
    </section>
  );
}

interface ServiceCardProps {
  service: MedicalService;
  username: string;
}

function ServiceCard({ service, username }: ServiceCardProps) {
  const { data: imageUrl } = useAssetUrl(service.imageAssetId || undefined);

  return (
    <Link to={`/${username}/services/${service.id}`} className="block group">
      <article
        className={cn(
          "flex gap-4 p-3 rounded-lg border bg-card",
          "transition-all duration-200",
          "hover:shadow-md hover:border-primary/50",
          "active:scale-[0.98]",
        )}
      >
        {/* Service Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="h-20 w-20 rounded-md overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={service.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-primary/40" />
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1">
            <h3 className="font-medium text-base leading-tight group-hover:text-primary transition-colors truncate">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs font-normal">
              {formatDuration(service.duration)}
            </Badge>
            {service.price && (
              <Badge variant="outline" className="text-xs font-normal">
                {formatPrice(service.price)}
              </Badge>
            )}
            {service.category && (
              <Badge variant="outline" className="text-xs font-normal">
                {service.category}
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
