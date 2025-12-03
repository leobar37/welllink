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
      {/* Header - Sticky on mobile */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 border-b sm:relative sm:mx-0 sm:px-0 sm:py-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <span>🤖</span> Análisis IA
            </h2>
            {clientName && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Para: {clientName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isLoading ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="flex-1 sm:flex-none"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Detener
              </Button>
            ) : (
              <Button
                variant={hasRecommendations ? "outline" : "default"}
                size="sm"
                onClick={onGenerate}
                className="flex-1 sm:flex-none"
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
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !hasRecommendations && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Generando recomendaciones personalizadas...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasRecommendations && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 border-2 border-dashed rounded-lg mx-2 sm:mx-0">
          <div className="text-4xl">🤖</div>
          <div className="text-center px-4">
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
          <TabsList className="grid w-full grid-cols-2 sticky top-[60px] sm:top-0 z-10 bg-background">
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
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generando...</span>
        </div>
      )}
    </div>
  );
}
