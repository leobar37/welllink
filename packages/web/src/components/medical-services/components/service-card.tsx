import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useAssetUrl } from "@/hooks/use-asset-url";
import { formatDuration, formatPrice } from "../utils/formatters";
import type { ServiceCardProps } from "../types";

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const { data: imageUrl } = useAssetUrl(service.imageAssetId || undefined);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription className="mt-1">
              {formatDuration(service.duration)}
            </CardDescription>
          </div>
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Imagen del servicio */}
          {service.imageAssetId && imageUrl && (
            <div className="aspect-video w-full rounded-md bg-muted/50 overflow-hidden">
              <img
                src={imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Descripción */}
          {service.description && (
            <p className="text-sm text-muted-foreground">
              {service.description}
            </p>
          )}

          {/* Precio */}
          {service.price && (
            <p className="text-lg font-semibold">
              {formatPrice(service.price)}
            </p>
          )}

          {/* Categoría */}
          {service.category && (
            <Badge variant="outline">{service.category}</Badge>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
