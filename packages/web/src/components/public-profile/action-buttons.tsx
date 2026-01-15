import { useParams } from "react-router";
import type { Feature } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
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

  // Filter to only show WhatsApp CTA
  const whatsappFeature = activeFeatures.find((f) => f.type === "whatsapp-cta");

  if (!whatsappFeature || !whatsappNumber || !config.isConnected) {
    return null;
  }

  // Clean phone number and create WhatsApp link
  const cleanPhone = whatsappNumber.replace(/[^\d+]/g, "");
  const link = `https://wa.me/${cleanPhone}`;

  return (
    <div className="w-full max-w-sm">
      <Button
        className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
        size="lg"
        asChild
      >
        <a href={link} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" />
          {(whatsappFeature.config.buttonText as string) || "Escríbeme por WhatsApp"}
        </a>
      </Button>
    </div>
  );
}