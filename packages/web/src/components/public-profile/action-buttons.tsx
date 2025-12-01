import { Link, useParams } from "react-router";
import type { Feature } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ActionButtonsProps {
  features: Feature[];
}

export function ActionButtons({ features }: ActionButtonsProps) {
  const { username } = useParams<{ username: string }>();
  const activeFeatures = features.filter((f) => f.isEnabled);

  if (!activeFeatures.length) return null;

  // Get the appropriate link for each feature type
  const getFeatureLink = (feature: Feature): string => {
    if (feature.type === "health-survey") {
      return `/${username}/survey`;
    }
    // Default fallback for other feature types
    return `#feature-${feature.id}`;
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      {activeFeatures.map((feature) => {
        const link = getFeatureLink(feature);
        const isInternalLink = link.startsWith("/");

        return (
          <Button
            key={feature.id}
            className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
            size="lg"
            asChild
          >
            {isInternalLink ? (
              <Link to={link}>
                {(feature.config.buttonText as string) || "Ver más"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <a href={link}>
                {(feature.config.buttonText as string) || "Ver más"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            )}
          </Button>
        );
      })}
    </div>
  );
}
