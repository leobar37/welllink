import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Loader2,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useProfile } from "@/hooks/use-profile";
import { WhatsAppCtaConfigModal } from "@/components/dashboard/WhatsAppCtaConfigModal";
import { useNavigate } from "react-router";

interface FeaturesConfig {
  whatsappCta?: {
    enabled: boolean;
    buttonText: string;
  };
}

interface ProfileWithFeatures {
  id: string;
  whatsappNumber?: string;
  featuresConfig?: FeaturesConfig;
}

export function FeaturesList() {
  const [whatsappCtaModalOpen, setWhatsappCtaModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { profile: rawProfile, isLoading } = useProfile();
  const profile = rawProfile as ProfileWithFeatures | undefined;

  // Get features config from profile
  const featuresConfig = profile?.featuresConfig || {};
  const whatsappCtaConfig = featuresConfig.whatsappCta || {
    enabled: false,
    buttonText: "Escríbeme por WhatsApp",
  };

  // Mutation for updating features config
  const updateFeaturesConfig = useMutation({
    mutationFn: async (config: FeaturesConfig) => {
      if (!profile?.id) throw new Error("No profile found");
      const { data, error } =
        await api.profiles[profile.id]["features-config"].patch(config);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Error al actualizar la configuración");
    },
  });

  const toggleWhatsappCta = async () => {
    // Check if whatsappNumber is configured
    if (!profile?.whatsappNumber) {
      toast.error(
        "Configura tu número de WhatsApp en tu perfil antes de activar esta función",
      );
      return;
    }

    const newEnabled = !whatsappCtaConfig.enabled;
    updateFeaturesConfig.mutate(
      {
        whatsappCta: {
          ...whatsappCtaConfig,
          enabled: newEnabled,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `WhatsApp CTA ${newEnabled ? "activado" : "desactivado"}`,
          );
        },
      },
    );
  };

  const handleSaveWhatsappCtaConfig = async (data: { buttonText: string }) => {
    updateFeaturesConfig.mutate(
      {
        whatsappCta: {
          ...whatsappCtaConfig,
          buttonText: data.buttonText,
        },
      },
      {
        onSuccess: () => {
          toast.success("Configuración guardada");
        },
      },
    );
  };

  // Static features list (appointments is coming soon)
  const features = [
    {
      id: "whatsapp-cta",
      name: "WhatsApp CTA",
      description:
        "Botón de llamada a acción que conecta directamente con tu WhatsApp.",
      enabled: whatsappCtaConfig.enabled,
      icon: MessageCircle,
      configurable: true,
      onConfigure: () => setWhatsappCtaModalOpen(true),
      requiresWhatsapp: true,
    },
    {
      id: "appointments",
      name: "Citas",
      description: "Permite a los clientes reservar consultas directamente.",
      enabled: false,
      comingSoon: true,
      icon: Settings2,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Funciones</h1>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={feature.comingSoon ? "opacity-70" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {feature.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`feature-${feature.id}`}
                  checked={feature.enabled}
                  onCheckedChange={() => {
                    if (feature.comingSoon) {
                      toast.info("¡Esta función próximamente!");
                      return;
                    }
                    if (feature.id === "whatsapp-cta") {
                      toggleWhatsappCta();
                      return;
                    }
                  }}
                  disabled={
                    feature.comingSoon || updateFeaturesConfig.isPending
                  }
                />
                <Label htmlFor={`feature-${feature.id}`}>
                  {feature.comingSoon
                    ? "Próximamente"
                    : feature.enabled
                      ? "Activa"
                      : "Inactiva"}
                </Label>
              </div>
            </CardHeader>
            {!feature.comingSoon && feature.enabled && feature.configurable && (
              <CardContent className="pt-4 border-t mt-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => feature.onConfigure?.()}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <WhatsAppCtaConfigModal
        open={whatsappCtaModalOpen}
        onOpenChange={setWhatsappCtaModalOpen}
        defaultValues={{
          buttonText: whatsappCtaConfig.buttonText,
        }}
        onSave={handleSaveWhatsappCtaConfig}
        isLoading={updateFeaturesConfig.isPending}
      />
    </div>
  );
}
