import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock3, Edit, Tag, Trash2, WalletCards } from "lucide-react";
import { useAssetUrl } from "@/hooks/use-asset-url";
import { formatDuration, formatPrice } from "../utils/formatters";
import type { ServiceCardProps } from "../types";

function formatCategoryLabel(category: string): string {
  return category
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const { data: imageUrl } = useAssetUrl(service.imageAssetId || undefined);
  const formattedPrice = service.price ? formatPrice(service.price) : "";
  const displayPrice = formattedPrice || "Precio por confirmar";
  const displayDescription =
    service.description?.trim() ||
    "Agrega una descripción clara para que tus pacientes entiendan mejor este servicio.";
  const hasCategory = Boolean(service.category?.trim());

  return (
    <Card className="group relative h-full overflow-hidden border-border/70 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="h-1 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/35" />
      <CardHeader className="pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-[1.85rem] leading-tight">
              {service.name}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary/80" />
              {formatDuration(service.duration)}
            </div>
          </div>
          <Badge
            variant={service.isActive ? "default" : "secondary"}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              service.isActive
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {service.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pb-5">
        {service.imageAssetId && imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-muted/50">
            <img
              src={imageUrl}
              alt={service.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <p className="min-h-[4.5rem] text-sm leading-relaxed text-muted-foreground">
          {displayDescription}
        </p>

        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <WalletCards className="h-3.5 w-3.5" />
            Precio
          </div>
          <p className="mt-1 text-[2.15rem] font-semibold leading-none text-foreground">
            {displayPrice}
          </p>
        </div>

        <div>
          {hasCategory ? (
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-full border-border/70 px-3 py-1 text-sm"
            >
              <Tag className="h-3.5 w-3.5 text-primary/80" />
              {formatCategoryLabel(service.category ?? "")}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Sin categoría</span>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Eliminar servicio ${service.name}`}
            className="text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
