import { Link, useParams } from "react-router";
import type { Feature } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";

interface ActionButtonsProps {
  features: Feature[];
  whatsappNumber?: string | null;
}

export function ActionButtons({
  features,
  whatsappNumber,
}: ActionButtonsProps) {
  const { username } = useParams<{ username: string }>();
  const { config } = useWhatsApp();
  const activeFeatures = features.filter((f) => f.isEnabled);

  // No buttons to show
  if (!activeFeatures.length) return null;

  // Get the appropriate link for each feature type
  const getFeatureLink = (feature: Feature): string => {
    if (feature.type === "health-survey") {
      return `/${username}/survey`;
    }
    if (feature.type === "tu-historia") {
      return `/${username}/historia`;
    }
    if (feature.type === "whatsapp-cta" && whatsappNumber) {
      // Clean phone number and create WhatsApp link
      const cleanPhone = whatsappNumber.replace(/[^\d+]/g, "");
      return `https://wa.me/${cleanPhone}`;
    }
    // Default fallback for other feature types
    return `#feature-${feature.id}`;
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      {activeFeatures.map((feature) => {
        const link = getFeatureLink(feature);
        const isInternalLink = link.startsWith("/");
        const isWhatsAppCta = feature.type === "whatsapp-cta";

        // Don't render WhatsApp CTA if no phone number configured or not connected
        if (isWhatsAppCta && (!whatsappNumber || !config.isConnected)) {
          return null;
        }

        return (
          <Button
            key={feature.id}
            className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
            size="lg"
            asChild
          >
            {isInternalLink ? (
              <Link to={link}>
                {isWhatsAppCta && <MessageCircle className="mr-2 h-4 w-4" />}
                {(feature.config.buttonText as string) || "Ver más"}
                {!isWhatsAppCta && <ArrowRight className="ml-2 h-4 w-4" />}
              </Link>
            ) : (
              <a href={link} target="_blank" rel="noopener noreferrer">
                {isWhatsAppCta && <MessageCircle className="mr-2 h-4 w-4" />}
                {(feature.config.buttonText as string) || "Ver más"}
                {!isWhatsAppCta && <ArrowRight className="ml-2 h-4 w-4" />}
              </a>
            )}
          </Button>
        );
      })}
    </div>
  );
}