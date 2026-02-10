import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatPrice,
} from "@/components/medical-services/utils/formatters";
import type { MedicalService } from "@/lib/types";

interface ServiceSelectorProps {
  services: MedicalService[];
  isLoading?: boolean;
  selectedService?: MedicalService;
  onSelect: (service: MedicalService) => void;
}

export function ServiceSelector({
  services,
  isLoading = false,
  selectedService,
  onSelect,
}: ServiceSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        No hay servicios disponibles
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const isSelected = selectedService?.id === service.id;

        return (
          <Card
            key={service.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected && "ring-2 ring-primary",
            )}
            onClick={() => onSelect(service)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {service.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatDuration(service.duration)}
                </Badge>
                {service.price && (
                  <Badge variant="outline">{formatPrice(service.price)}</Badge>
                )}
                {service.category && (
                  <Badge variant="outline">{service.category}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
