import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, StopCircle } from "lucide-react";
import type { AIResponse } from "../schema";
import { ClientTab } from "./ClientTab";
import { AdvisorTab } from "./AdvisorTab";

interface RecommendationsViewProps {
  recommendations?: AIResponse;
  isLoading: boolean;
  onGenerate: () => void;
  onStop: () => void;
  onExportPdf?: () => void;
  clientName?: string;
}

export function RecommendationsView({
  recommendations,
  isLoading,
  onGenerate,
  onStop,
  onExportPdf,
  clientName = "Cliente",
}: RecommendationsViewProps) {
  const [activeTab, setActiveTab] = useState("client");
  const hasRecommendations = !!recommendations?.clientRecommendations;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>🤖</span> Análisis IA
          </h2>
          {clientName && (
            <p className="text-sm text-muted-foreground">Para: {clientName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button variant="destructive" size="sm" onClick={onStop}>
              <StopCircle className="h-4 w-4 mr-2" />
              Detener
            </Button>
          ) : (
            <Button
              variant={hasRecommendations ? "outline" : "default"}
              size="sm"
              onClick={onGenerate}
            >
              {hasRecommendations ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Generar Análisis
                </>
              )}
            </Button>
          )}

          {hasRecommendations && onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !hasRecommendations && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Generando recomendaciones personalizadas...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasRecommendations && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 border-2 border-dashed rounded-lg">
          <div className="text-4xl">🤖</div>
          <div className="text-center">
            <h3 className="font-medium">Sin análisis generado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Haz clic en "Generar Análisis" para obtener recomendaciones
              personalizadas basadas en la encuesta de salud.
            </p>
          </div>
          <Button onClick={onGenerate} disabled={isLoading}>
            <span className="mr-2">✨</span>
            Generar Análisis IA
          </Button>
        </div>
      )}

      {/* Content with Tabs */}
      {hasRecommendations && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client" className="flex items-center gap-2">
              <span>📄</span>
              <span className="hidden sm:inline">Para el Cliente</span>
              <span className="sm:hidden">Cliente</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2">
              <span>🔒</span>
              <span className="hidden sm:inline">Notas del Asesor</span>
              <span className="sm:hidden">Asesor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="mt-4">
            <ClientTab data={recommendations?.clientRecommendations} />
          </TabsContent>

          <TabsContent value="advisor" className="mt-4">
            <AdvisorTab data={recommendations?.advisorNotes} />
          </TabsContent>
        </Tabs>
      )}

      {/* Streaming indicator */}
      {isLoading && hasRecommendations && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generando...</span>
        </div>
      )}
    </div>
  );
}
