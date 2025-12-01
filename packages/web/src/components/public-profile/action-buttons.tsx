import type { Feature } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ActionButtonsProps {
  features: Feature[];
}

export function ActionButtons({ features }: ActionButtonsProps) {
  const activeFeatures = features.filter((f) => f.isEnabled);

  if (!activeFeatures.length) return null;

  return (
    <div className="w-full max-w-sm space-y-3">
      {activeFeatures.map((feature) => (
        <Button
          key={feature.id}
          className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
          size="lg"
          // In a real app, this would link to the feature route or open a modal
          // For now we'll just use a placeholder href
          asChild
        >
          <a href={`#feature-${feature.id}`}>
            {(feature.config.buttonText as string) || "Ver más"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ))}
    </div>
  );
}
