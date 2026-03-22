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
          "flex gap-4 p-4 rounded-xl border bg-card",
          "transition-all duration-300 ease-out",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5",
          "active:scale-[0.98] active:duration-150",
        )}
      >
        {/* Service Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-primary/20 transition-all duration-300">
              <img
                src={imageUrl}
                alt={service.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-background flex items-center justify-center ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
              <Stethoscope className="h-8 w-8 text-primary/50 group-hover:text-primary/70 transition-colors duration-300" />
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors duration-200 line-clamp-1">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap mt-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2.5 py-0.5 bg-primary/5 text-primary/80 hover:bg-primary/10 transition-colors"
            >
              {formatDuration(service.duration)}
            </Badge>
            {service.price && (
              <Badge
                variant="outline"
                className="text-xs font-medium px-2.5 py-0.5 border-emerald-200/60 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {formatPrice(service.price)}
              </Badge>
            )}
            {service.category && (
              <Badge
                variant="outline"
                className="text-xs font-normal px-2.5 py-0.5 text-muted-foreground"
              >
                {service.category}
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
