import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { AgentConfigData, TonePreset } from "@/hooks/use-agent-config";

interface ToneSettingsFormProps {
  config: AgentConfigData | null;
  tonePresets: Array<{ id: string; description: string }>;
  onToneChange: (tone: TonePreset) => Promise<void>;
  onCustomInstructionsChange: (value: string) => Promise<void>;
  onWelcomeMessageChange: (value: string) => Promise<void>;
  isSaving: boolean;
}

export function ToneSettingsForm({
  config,
  tonePresets,
  onToneChange,
  onCustomInstructionsChange,
  onWelcomeMessageChange,
  isSaving,
}: ToneSettingsFormProps) {
  const [localTone, setLocalTone] = useState<TonePreset>(
    (config?.tonePreset as TonePreset) || "professional",
  );
  const [localCustomInstructions, setLocalCustomInstructions] = useState(
    config?.customInstructions || "",
  );
  const [localWelcomeMessage, setLocalWelcomeMessage] = useState(
    config?.welcomeMessage || "",
  );

  const handleToneChange = async (value: string) => {
    setLocalTone(value as TonePreset);
    await onToneChange(value as TonePreset);
  };

  const handleCustomInstructionsBlur = async () => {
    if (localCustomInstructions !== (config?.customInstructions || "")) {
      await onCustomInstructionsChange(localCustomInstructions);
    }
  };

  const handleWelcomeMessageBlur = async () => {
    if (localWelcomeMessage !== config?.welcomeMessage) {
      await onWelcomeMessageChange(localWelcomeMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tone Selection */}
      <div className="space-y-4">
        <Label>Tono del asistente</Label>
        <RadioGroup
          value={localTone}
          onValueChange={handleToneChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          disabled={isSaving}
        >
          {tonePresets.map((preset) => (
            <div
              key={preset.id}
              className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                localTone === preset.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <RadioGroupItem value={preset.id} id={`tone-${preset.id}`} />
              <div className="flex-1">
                <Label
                  htmlFor={`tone-${preset.id}`}
                  className="font-medium capitalize cursor-pointer"
                >
                  {preset.id}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {preset.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <Label htmlFor="welcome-message">Mensaje de bienvenida</Label>
        <Textarea
          id="welcome-message"
          value={localWelcomeMessage}
          onChange={(e) => setLocalWelcomeMessage(e.target.value)}
          onBlur={handleWelcomeMessageBlur}
          placeholder="¡Hola! Soy el asistente de Dr. X..."
          className="min-h-[100px]"
          disabled={isSaving}
        />
        <p className="text-sm text-muted-foreground">
          Este mensaje aparece cuando un usuario inicia una conversación
        </p>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-2">
        <Label htmlFor="custom-instructions">
          Instrucciones personalizadas (opcional)
        </Label>
        <Textarea
          id="custom-instructions"
          value={localCustomInstructions}
          onChange={(e) => setLocalCustomInstructions(e.target.value)}
          onBlur={handleCustomInstructionsBlur}
          placeholder="Ej: Usa 'Dr.' antes de mi nombre. Enfatiza la puntualidad en las respuestas..."
          className="min-h-[120px]"
          disabled={isSaving}
        />
        <p className="text-sm text-muted-foreground">
          Añade instrucciones adicionales para personalizar el comportamiento
          del agente
        </p>
      </div>

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando...
        </div>
      )}
    </div>
  );
}
