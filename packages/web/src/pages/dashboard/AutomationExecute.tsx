import { useNavigate, useParams } from "react-router";
import { useAutomation, useExecuteAutomation } from "@/hooks/use-automations";
import { Loader2, Play, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export function AutomationExecutePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { data: automation, isLoading } = useAutomation(id || "");
  const { mutate: executeAutomation, isPending: isExecuting } = useExecuteAutomation();

  const handleExecute = () => {
    if (!id) return;

    executeAutomation(
      { automationId: id },
      {
        onSuccess: () => {
          toast.success("Automatización ejecutada correctamente");
          navigate(`/dashboard/automations/${id}/logs`);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/automations/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ejecutar Automatización</h1>
          <p className="text-muted-foreground">
            {automation?.name || "Automatización"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Ahora</CardTitle>
          <CardDescription>
            Ejecuta la automatización manualmente. Esto disparará todas las acciones configuradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{automation?.name}</p>
              <p className="text-sm text-muted-foreground">
                {automation?.description || "Sin descripción"}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleExecute} 
                disabled={isExecuting || !automation?.enabled}
                size="lg"
              >
                {isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Ejecutar Automatización
              </Button>
              
              {!automation?.enabled && (
                <span className="text-sm text-orange-600">
                  La automatización está desactivada
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
