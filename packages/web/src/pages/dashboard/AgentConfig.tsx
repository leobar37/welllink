import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bot, MessageCircle, Settings, Layout } from "lucide-react";
import { useAgentConfig, type TonePreset } from "@/hooks/use-agent-config";
import { ToneSettingsForm } from "@/components/agent/ToneSettingsForm";
import { SuggestionsConfig } from "@/components/agent/SuggestionsConfig";

export function AgentConfig() {
  const { data: session } = authClient.useSession();
  const profileId = session?.user?.profileId || "";

  const {
    config,
    tonePresets,
    isLoading,
    isSaving,
    fetchConfig,
    updateConfig,
    fetchTonePresets,
  } = useAgentConfig();

  const [activeTab, setActiveTab] = useState("tone");

  useEffect(() => {
    if (profileId) {
      fetchConfig(profileId);
      fetchTonePresets();
    }
  }, [profileId, fetchConfig, fetchTonePresets]);

  const handleToneChange = async (tone: TonePreset) => {
    if (profileId) {
      await updateConfig(profileId, { tonePreset: tone });
    }
  };

  const handleCustomInstructionsChange = async (value: string) => {
    if (profileId) {
      await updateConfig(profileId, { customInstructions: value });
    }
  };

  const handleWelcomeMessageChange = async (value: string) => {
    if (profileId) {
      await updateConfig(profileId, { welcomeMessage: value });
    }
  };

  const handleWidgetEnabledChange = async (enabled: boolean) => {
    if (profileId) {
      await updateConfig(profileId, { widgetEnabled: enabled });
    }
  };

  const handleWhatsAppEnabledChange = async (enabled: boolean) => {
    if (profileId) {
      await updateConfig(profileId, { whatsappEnabled: enabled });
    }
  };

  const handleWhatsAppAutoTransferChange = async (enabled: boolean) => {
    if (profileId) {
      await updateConfig(profileId, { whatsappAutoTransfer: enabled });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Configuración del Agente IA
          </h1>
          <p className="text-muted-foreground">
            Personaliza el comportamiento de tu asistente virtual
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Tabs */}
        <div className="flex space-x-2 border-b pb-2">
          <Button
            variant={activeTab === "tone" ? "default" : "ghost"}
            onClick={() => setActiveTab("tone")}
            className="gap-2"
          >
            <Bot className="h-4 w-4" />
            Tono y Comportamiento
          </Button>
          <Button
            variant={activeTab === "suggestions" ? "default" : "ghost"}
            onClick={() => setActiveTab("suggestions")}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Sugerencias
          </Button>
          <Button
            variant={activeTab === "widget" ? "default" : "ghost"}
            onClick={() => setActiveTab("widget")}
            className="gap-2"
          >
            <Layout className="h-4 w-4" />
            Chat Widget
          </Button>
          <Button
            variant={activeTab === "whatsapp" ? "default" : "ghost"}
            onClick={() => setActiveTab("whatsapp")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>

        {/* Tone & Behavior Tab */}
        {activeTab === "tone" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tono del Asistente</CardTitle>
                <CardDescription>
                  Elige el tono que mejor se adapte a tu práctica profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToneSettingsForm
                  config={config}
                  tonePresets={tonePresets}
                  onToneChange={handleToneChange}
                  onCustomInstructionsChange={handleCustomInstructionsChange}
                  onWelcomeMessageChange={handleWelcomeMessageChange}
                  isSaving={isSaving}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === "suggestions" && (
          <Card>
            <CardHeader>
              <CardTitle>Sugerencias del Chat</CardTitle>
              <CardDescription>
                Personaliza las preguntas sugeridas que aparecen al inicio del
                chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SuggestionsConfig
                profileId={profileId}
                initialSuggestions={config?.suggestions || []}
              />
            </CardContent>
          </Card>
        )}

        {/* Widget Tab */}
        {activeTab === "widget" && (
          <Card>
            <CardHeader>
              <CardTitle>Chat Widget Web</CardTitle>
              <CardDescription>
                Configura la visibilidad y comportamiento del widget de chat en
                tu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="widget-enabled">
                    Habilitar widget de chat
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar el botón de chat en tu perfil público
                  </p>
                </div>
                <Switch
                  id="widget-enabled"
                  checked={config?.widgetEnabled || false}
                  onCheckedChange={handleWidgetEnabledChange}
                  disabled={isSaving}
                />
              </div>

              {config?.widgetEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="widget-color">Color del widget</Label>
                    <Input
                      id="widget-color"
                      type="color"
                      value={config.widgetPrimaryColor || "#0066cc"}
                      onChange={(e) =>
                        updateConfig(profileId, {
                          widgetPrimaryColor: e.target.value,
                        })
                      }
                      className="h-10 w-32"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Tab */}
        {activeTab === "whatsapp" && (
          <Card>
            <CardHeader>
              <CardTitle>Chatbot de WhatsApp</CardTitle>
              <CardDescription>
                Configura cómo responde el agente cuando te contactan por
                WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp-enabled">
                    Habilitar agente en WhatsApp
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    El agente responderá automáticamente a mensajes de WhatsApp
                  </p>
                </div>
                <Switch
                  id="whatsapp-enabled"
                  checked={config?.whatsappEnabled || false}
                  onCheckedChange={handleWhatsAppEnabledChange}
                  disabled={isSaving}
                />
              </div>

              {config?.whatsappEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="whatsapp-transfer">
                      Auto-transferir al web
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sugerir al usuario continuar en el chat web para agendar
                      citas
                    </p>
                  </div>
                  <Switch
                    id="whatsapp-transfer"
                    checked={config?.whatsappAutoTransfer || false}
                    onCheckedChange={handleWhatsAppAutoTransferChange}
                    disabled={isSaving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
