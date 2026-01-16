import { useParams } from "react-router";
import { Link } from "react-router";
import type { Feature } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar } from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";

interface ActionButtonsProps {
  features: Feature[];
  whatsappNumber?: string | null;
  medicalServices?: any[];
}

export function ActionButtons({
  features,
  whatsappNumber,
  medicalServices,
}: ActionButtonsProps) {
  const { username } = useParams<{ username: string }>();
  const { config } = useWhatsApp();
  const activeFeatures = features.filter((f) => f.isEnabled);

  // No buttons to show
  if (!activeFeatures.length) return null;

  // Filter to only show WhatsApp CTA
  const whatsappFeature = activeFeatures.find((f) => f.type === "whatsapp-cta");

  // Check if medical services feature is enabled
  const hasMedicalServices = medicalServices && medicalServices.length > 0;

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Booking Button */}
      {hasMedicalServices && (
        <Button
          className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
          size="lg"
          asChild
        >
          <Link to={`/${username}/booking`}>
            <Calendar className="mr-2 h-4 w-4" />
            Reservar Cita
          </Link>
        </Button>
      )}

      {/* WhatsApp Button */}
      {whatsappFeature && whatsappNumber && config.isConnected && (
        <Button
          className="w-full h-12 text-base font-medium shadow-sm transition-all hover:scale-[1.02]"
          size="lg"
          variant={hasMedicalServices ? "outline" : "default"}
          asChild
        >
          <a href={`https://wa.me/${whatsappNumber.replace(/[^\d+]/g, "")}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            {(whatsappFeature.config.buttonText as string) || "Escríbeme por WhatsApp"}
          </a>
        </Button>
      )}
    </div>
  );
}