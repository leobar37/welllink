import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRecommendations } from "../schema";

interface BMICardProps {
  data?: ClientRecommendations["bmi"];
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-blue-600" };
  if (bmi < 25) return { label: "Normal", color: "text-green-600" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
  if (bmi < 35) return { label: "Obesidad I", color: "text-orange-600" };
  return { label: "Obesidad II+", color: "text-red-600" };
}

export function BMICard({ data }: BMICardProps) {
  // Validación defensiva: verificar que data y sus propiedades requeridas existan
  const isDataComplete =
    data &&
    typeof data.current === "number" &&
    typeof data.currentWeight === "number" &&
    typeof data.targetWeight === "number";

  if (!isDataComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span> Índice de Masa Corporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bmiInfo = getBMICategory(data.current);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span> Índice de Masa Corporal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${bmiInfo.color}`}>
            {data.current.toFixed(1)}
          </div>
          <div className={`text-sm font-medium ${bmiInfo.color}`}>
            {data.category || bmiInfo.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-2xl font-semibold">
              {data.currentWeight} kg
            </div>
            <div className="text-xs text-muted-foreground">Peso actual</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <div className="text-2xl font-semibold text-green-600">
              {data.targetWeight} kg
            </div>
            <div className="text-xs text-muted-foreground">Peso meta</div>
          </div>
        </div>

        {data.weightToLose > 0 && (
          <div className="text-center p-3 bg-muted rounded-lg">
            <span className="text-sm">Meta: perder </span>
            <span className="font-semibold text-orange-600">
              {data.weightToLose} kg
            </span>
          </div>
        )}

        {data.healthyRange && (
          <div className="text-center text-sm text-muted-foreground">
            Rango saludable: {data.healthyRange.min} - {data.healthyRange.max}{" "}
            kg
          </div>
        )}
      </CardContent>
    </Card>
  );
}
