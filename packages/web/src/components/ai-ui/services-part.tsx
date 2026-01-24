import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServicesAIPart, AIUIHandlers, ServiceData } from "./types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface ServicesPartProps {
  part: ServicesAIPart;
  handlers: AIUIHandlers;
}

export const ServicesPart = memo(({ part, handlers }: ServicesPartProps) => {
  return (
    <div className="space-y-3 my-4">
      {part.title && (
        <p className="text-sm font-medium text-muted-foreground ml-1">
          {part.title}
        </p>
      )}
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full max-w-[calc(100vw-4rem)] sm:max-w-md"
      >
        <CarouselContent className="-ml-2">
          {part.services.map((service) => (
            <CarouselItem
              key={service.id}
              className="pl-2 basis-[85%] sm:basis-[70%]"
            >
              <ServiceCard
                service={service}
                onSelect={handlers.onSelectService}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {part.services.length > 1 && (
          <div className="flex justify-end gap-2 mt-2 mr-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        )}
      </Carousel>
    </div>
  );
});

interface ServiceCardProps {
  service: ServiceData;
  onSelect?: (service: ServiceData) => void;
}

const ServiceCard = memo(({ service, onSelect }: ServiceCardProps) => {
  return (
    <Card
      className={cn(
        "h-full flex flex-col cursor-pointer transition-all hover:shadow-md",
        "hover:border-primary/50 border-muted-foreground/20",
        onSelect && "hover:ring-2 hover:ring-primary/20",
      )}
      onClick={() => onSelect?.(service)}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-semibold leading-tight line-clamp-1">
          {service.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {service.duration}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {service.price}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full h-8 text-xs gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(service);
          }}
        >
          <Calendar className="size-3" />
          Agendar
        </Button>
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = "ServiceCard";
ServicesPart.displayName = "ServicesPart";

export default ServicesPart;
