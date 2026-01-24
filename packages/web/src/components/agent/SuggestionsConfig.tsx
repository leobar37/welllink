import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Loader2 } from "lucide-react";
import { useSuggestions } from "@/hooks/use-agent-config";

interface SuggestionsConfigProps {
  profileId: string;
  initialSuggestions: string[];
}

export function SuggestionsConfig({
  profileId,
  initialSuggestions,
}: SuggestionsConfigProps) {
  const { suggestions, isLoading, updateSuggestions } =
    useSuggestions(profileId);
  const [newSuggestion, setNewSuggestion] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentSuggestions =
    suggestions.length > 0 ? suggestions : initialSuggestions;

  const handleAdd = async () => {
    if (!newSuggestion.trim()) return;

    const updated = [...currentSuggestions, newSuggestion.trim()];
    setIsSaving(true);
    await updateSuggestions(profileId, updated);
    setNewSuggestion("");
    setIsSaving(false);
  };

  const handleRemove = async (index: number) => {
    const updated = currentSuggestions.filter((_, i) => i !== index);
    setIsSaving(true);
    await updateSuggestions(profileId, updated);
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new-suggestion">Agregar nueva sugerencia</Label>
        <div className="flex gap-2">
          <Input
            id="new-suggestion"
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: ¿Tienen estacionamiento?"
            disabled={isSaving}
          />
          <Button
            onClick={handleAdd}
            disabled={!newSuggestion.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Sugerencias actuales ({currentSuggestions.length})</Label>
        {currentSuggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay sugerencias configuradas. Agrega algunas arriba.
          </p>
        ) : (
          <div className="grid gap-2">
            {currentSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
              >
                <span className="flex-1 text-sm">{suggestion}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  disabled={isSaving}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          💡 Las sugerencias aparecen como botones al inicio de la conversación.
        </p>
        <p>
          Los usuarios pueden hacer clic en ellas para enviar rápidamente una
          pregunta.
        </p>
      </div>
    </div>
  );
}
